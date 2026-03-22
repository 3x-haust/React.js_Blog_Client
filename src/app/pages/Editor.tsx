import { useState, useEffect, useRef, useDeferredValue } from 'react';
import { useParams, useNavigate } from 'react-router';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Plus, Trash2, X } from 'lucide-react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { adminAuth, blogApi } from '../lib/api';
import {
  saveDraft,
  clearDraft,
  calculateReadingTime,
  listDrafts,
  getDraftById,
  type DraftPost,
} from '../lib/storage';
import { Post, ContentBlock } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { EditorSidebar } from '../components/editor/EditorSidebar';
import { EditorCanvas } from '../components/editor/EditorCanvas';
import { EditorToolbar } from '../components/editor/EditorToolbar';
import { ContentRenderer } from '../components/ContentRenderer';
import { Dialog, DialogContent, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Card } from '../components/ui/card';
import { z } from 'zod';
import { parseMarkdownToEditorContent } from '../lib/markdownImport';

const seriesNameSchema = z.string().trim().max(50, '시리즈 이름은 50자 이하로 입력해주세요.');
const adminLoginSchema = z.object({
  nickname: z.string().trim().min(1, '닉네임을 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});
const postTitleSchema = z.string().trim().min(1, '타이틀은 필수 입력 항목입니다.').max(100, '타이틀은 100자 이내로 입력해주세요.');

export function Editor() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [content, setContent] = useState<ContentBlock[]>([]);
  const [existingPost, setExistingPost] = useState<Post | null>(null);
  const [isAdmin, setIsAdmin] = useState(() => adminAuth.isCachedAuthenticated());
  const [adminNickname, setAdminNickname] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [seriesName, setSeriesName] = useState('');
  const [titleError, setTitleError] = useState('');
  const [seriesNameError, setSeriesNameError] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [draftList, setDraftList] = useState<DraftPost[]>([]);
  const [showDraftListDialog, setShowDraftListDialog] = useState(false);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const deferredTitle = useDeferredValue(title);
  const deferredContent = useDeferredValue(content);
  const isEditMode = Boolean(slug);

  const editorScrollRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingScroll = useRef(false);

  const getEditorTagsWithSeries = () => [
    ...tags,
    ...(seriesName.trim() ? [`series:${seriesName.trim()}`] : []),
  ];

  const hasUnsavedEditChanges =
    isEditMode &&
    Boolean(existingPost) &&
    JSON.stringify({
      title: title.trim(),
      thumbnail: thumbnail.trim(),
      tags: getEditorTagsWithSeries(),
      content,
    }) !==
      JSON.stringify({
        title: (existingPost?.title ?? '').trim(),
        thumbnail: (existingPost?.thumbnail ?? '').trim(),
        tags: existingPost?.tags ?? [],
        content: existingPost?.content ?? [],
      });

  const loadDraftIntoEditor = (draft: DraftPost) => {
    setTitle(draft.title || '');
    setThumbnail(draft.thumbnail || '');
    const draftTags = draft.tags || [];
    const nextSeriesTag = draftTags.find((tag) => tag.toLowerCase().startsWith('series:'));
    setSeriesName(nextSeriesTag ? nextSeriesTag.slice('series:'.length).trim() : '');
    setTags(draftTags.filter((tag) => !tag.toLowerCase().startsWith('series:')));
    setContent(draft.content || []);
    setCurrentDraftId(draft.id);
  };

  const resetEditorForNewPost = () => {
    setTitle('');
    setThumbnail('');
    setSeriesName('');
    setTags([]);
    setTagInput('');
    setContent([]);
    setCurrentDraftId(null);
  };

  const refreshDraftList = () => {
    setDraftList(listDrafts());
  };

  const validateSeriesNameInput = (value: string): boolean => {
    if (!value.trim()) {
      setSeriesNameError('');
      return true;
    }

    const result = seriesNameSchema.safeParse(value);
    if (!result.success) {
      setSeriesNameError(result.error.issues[0]?.message ?? '시리즈 이름을 확인해주세요.');
      return false;
    }
    setSeriesNameError('');
    return true;
  };

  const validateTitleInput = (value: string): boolean => {
    const result = postTitleSchema.safeParse(value);
    if (!result.success) {
      setTitleError(result.error.issues[0]?.message ?? '타이틀을 확인해주세요.');
      return false;
    }
    setTitleError('');
    return true;
  };

  const handleThumbnailFileSelect = async (file: File | null) => {
    if (!file) return;

    try {
      setIsUploadingThumbnail(true);
      const uploadedUrl = await blogApi.uploadImage(file);
      setThumbnail(uploadedUrl);
      toast.success('썸네일 업로드 완료');
    } catch (error) {
      toast.error((error as Error).message || '이미지 업로드에 실패했습니다.');
    } finally {
      setIsUploadingThumbnail(false);
    }
  };

  useEffect(() => {
    adminAuth.check().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    if (slug) {
      blogApi
        .getPost(slug)
        .then((post) => {
          setExistingPost(post);
          setCurrentDraftId(null);
          setTitle(post.title);
          setThumbnail(post.thumbnail || '');
          const nextSeriesTag = post.tags.find((tag) => tag.toLowerCase().startsWith('series:'));
          setSeriesName(nextSeriesTag ? nextSeriesTag.slice('series:'.length).trim() : '');
          setTags(post.tags.filter((tag) => !tag.toLowerCase().startsWith('series:')));
          setContent(post.content);
        })
        .catch(() => toast.error('포스트를 불러오지 못했습니다.'));
    } else {
      refreshDraftList();
    }
  }, [slug, isAdmin]);

  useEffect(() => {
    if (isEditMode) {
      return;
    }

    autoSaveTimer.current = setInterval(() => {
      if (title || content.length > 0) {
        const saved = saveDraft(
          {
            title,
            thumbnail,
            tags: getEditorTagsWithSeries(),
            content,
          },
          currentDraftId ?? undefined,
        );
        if (!currentDraftId) {
          setCurrentDraftId(saved.id);
        }
        toast.success('자동 저장됨', { duration: 1000 });
      }
    }, 30000);

    return () => {
      if (autoSaveTimer.current) {
        clearInterval(autoSaveTimer.current);
      }
    };
  }, [
    title,
    thumbnail,
    tags,
    content,
    seriesName,
    currentDraftId,
    isEditMode,
  ]);

  useEffect(() => {
    if (!hasUnsavedEditChanges) {
      return;
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [hasUnsavedEditChanges]);

  const handleAddTag = () => {
    const nextTag = tagInput.trim();
    if (!nextTag) return;

    setTags((prevTags) => {
      if (prevTags.includes(nextTag)) {
        return prevTags;
      }
      return [...prevTags, nextTag];
    });
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handlePublish = async () => {
    if (isPublishing) {
      return;
    }

    if (!isAdmin) {
      toast.error('관리자 인증이 필요합니다.');
      return;
    }

    if (!title.trim()) {
      toast.error('타이틀을 입력해주세요.');
      return;
    }

    if (!validateSeriesNameInput(seriesName)) {
      toast.error('시리즈 이름을 확인해주세요.');
      return;
    }

    if (!validateTitleInput(title)) {
      toast.error('타이틀을 확인해주세요.');
      return;
    }

    if (content.length === 0) {
      toast.error('내용을 작성해주세요');
      return;
    }

    const postSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-');

    const postPayload = {
      slug: postSlug,
      title,
      thumbnail,
      tags: getEditorTagsWithSeries(),
      content,
      views: existingPost?.views ?? 0,
      readingTime: calculateReadingTime(content),
    };

    const action = slug
      ? blogApi.updatePost(slug, postPayload)
      : blogApi.createPost(postPayload);

    try {
      setIsPublishing(true);
      const savedPost = await action;
      if (currentDraftId) {
        clearDraft(currentDraftId);
        setCurrentDraftId(null);
      }
      toast.success(slug ? '포스트가 수정되었습니다' : '포스트가 발행되었습니다');
      navigate(`/posts/${savedPost.slug}`);
    } catch (error) {
      toast.error((error as Error).message || '발행에 실패했습니다.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleAdminLogin = async () => {
    if (isLoggingIn) {
      return;
    }

    const loginValidation = adminLoginSchema.safeParse({
      nickname: adminNickname,
      password: adminPassword,
    });

    if (!loginValidation.success) {
      setAdminLoginError(loginValidation.error.issues[0]?.message ?? '로그인 정보를 확인해주세요.');
      return;
    }

    setAdminLoginError('');

    try {
      setIsLoggingIn(true);
      await adminAuth.login(adminNickname.trim(), adminPassword);
      setIsAdmin(true);
      setAdminPassword('');
      toast.success('관리자 로그인 성공');
    } catch (error) {
      toast.error((error as Error).message || '관리자 로그인 실패');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleManualSave = () => {
    if (isSavingDraft || isPublishing) {
      return;
    }

    if (isEditMode) {
      toast.message('수정 모드에서는 임시저장을 사용하지 않습니다.');
      return;
    }

    try {
      setIsSavingDraft(true);
      const hasEditorValue =
        Boolean(title.trim()) ||
        Boolean(thumbnail.trim()) ||
        Boolean(seriesName.trim()) ||
        tags.length > 0 ||
        content.length > 0;

      if (hasEditorValue) {
        const saved = saveDraft(
          {
            title,
            thumbnail,
            tags: getEditorTagsWithSeries(),
            content,
          },
          currentDraftId ?? undefined,
        );
        setCurrentDraftId(saved.id);
        toast.success('임시 저장됨');
      } else {
        toast.message('저장할 내용이 아직 없습니다.');
      }
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleOpenDraftList = () => {
    if (isEditMode) {
      toast.message('수정 모드에서는 임시저장 목록을 사용하지 않습니다.');
      return;
    }

    refreshDraftList();
    setShowDraftListDialog(true);
  };

  const handleSelectDraft = (draftId: string) => {
    const draft = getDraftById(draftId);
    if (!draft) {
      toast.error('선택한 임시저장을 찾을 수 없습니다.');
      refreshDraftList();
      return;
    }

    loadDraftIntoEditor(draft);
    setShowDraftListDialog(false);
    toast.success('임시저장을 불러왔습니다.');
  };

  const handleCreateNewDraft = () => {
    resetEditorForNewPost();
    setShowDraftListDialog(false);
    toast.success('새 글 작성을 시작합니다.');
  };

  const handleDeleteDraft = (draftId: string) => {
    clearDraft(draftId);

    if (currentDraftId === draftId) {
      setCurrentDraftId(null);
    }

    refreshDraftList();
    toast.success('임시저장을 삭제했습니다.');
  };

  const processImportedMarkdown = (markdown: string) => {
    try {
      const parsed = parseMarkdownToEditorContent(markdown);

      if (!parsed.content.length) {
        toast.error('변환할 본문 블록을 찾지 못했습니다.');
        return;
      }

      if (parsed.title.trim()) {
        setTitle(parsed.title.trim());
      }

      if (parsed.thumbnail.trim()) {
        setThumbnail(parsed.thumbnail.trim());
      }

      if (parsed.tags.length > 0) {
        const seriesTag = parsed.tags.find((tag) =>
          tag.toLowerCase().startsWith('series:'),
        );

        setSeriesName(
          seriesTag ? seriesTag.slice('series:'.length).trim() : '',
        );
        setTags(
          parsed.tags.filter(
            (tag) => !tag.toLowerCase().startsWith('series:'),
          ),
        );
      }

      setContent(parsed.content);

      toast.success(`마크다운 가져오기 완료 (${parsed.content.length}개 블록)`);
    } catch {
      toast.error('마크다운을 처리하지 못했습니다.');
    }
  };

  const handleImportMarkdown = async (file: File) => {
    if (!/\.md$|\.markdown$/i.test(file.name)) {
      toast.error('마크다운(.md) 파일만 가져올 수 있습니다.');
      return;
    }

    const hasAnyEditorContent =
      Boolean(title.trim()) ||
      Boolean(thumbnail.trim()) ||
      Boolean(seriesName.trim()) ||
      tags.length > 0 ||
      content.length > 0;

    if (hasAnyEditorContent) {
      const shouldReplace = window.confirm(
        '현재 작성 중인 내용이 마크다운 내용으로 교체됩니다. 계속할까요?',
      );
      if (!shouldReplace) {
        return;
      }
    }

    try {
      const markdown = await file.text();
      processImportedMarkdown(markdown);
    } catch {
      toast.error('마크다운 파일을 불러오지 못했습니다.');
    }
  };

  const handlePasteMarkdown = (markdown: string) => {
    const hasAnyEditorContent =
      Boolean(title.trim()) ||
      Boolean(thumbnail.trim()) ||
      Boolean(seriesName.trim()) ||
      tags.length > 0 ||
      content.length > 0;

    if (hasAnyEditorContent) {
      const shouldReplace = window.confirm(
        '현재 작성 중인 내용이 마크다운 내용으로 교체됩니다. 계속할까요?',
      );
      if (!shouldReplace) {
        return;
      }
    }

    processImportedMarkdown(markdown);
  };

  const handleScroll = (source: 'editor' | 'preview') => {
    if (isSyncingScroll.current) return;

    const sourceEl = source === 'editor' ? editorScrollRef.current : previewScrollRef.current;
    const targetEl = source === 'editor' ? previewScrollRef.current : editorScrollRef.current;

    if (!sourceEl || !targetEl) return;

    isSyncingScroll.current = true;
    const scrollPercentage = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);
    targetEl.scrollTop = scrollPercentage * (targetEl.scrollHeight - targetEl.clientHeight);

    setTimeout(() => {
      isSyncingScroll.current = false;
    }, 50);
  };

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16">
        <Card className="p-6 space-y-10">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleAdminLogin();
            }}
          >
          <h1 className="text-2xl">관리자 로그인</h1>
          <Input
            value={adminNickname}
            onChange={(e) => {
              setAdminNickname(e.target.value);
              if (adminLoginError) {
                setAdminLoginError('');
              }
            }}
            placeholder="닉네임 입력..."
          />
          <Input
            type="password"
            value={adminPassword}
            onChange={(e) => {
              setAdminPassword(e.target.value);
              if (adminLoginError) {
                setAdminLoginError('');
              }
            }}
            placeholder="비밀번호 입력..."
          />
          {adminLoginError && (
            <p className="text-sm text-destructive">{adminLoginError}</p>
          )}
          <div className="flex justify-center">
            <Button type="submit" disabled={isLoggingIn}>
              {isLoggingIn ? '로그인 중...' : '로그인'}
            </Button>
          </div>
          </form>
        </Card>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-background">
        <EditorToolbar
          onSave={handleManualSave}
          onOpenDraftList={handleOpenDraftList}
          onImportMarkdown={handleImportMarkdown}
          onPasteMarkdown={handlePasteMarkdown}
          onPublish={() => setShowPublishDialog(true)}
          isSaving={isSavingDraft}
          isPublishing={isPublishing}
          disableDraftActions={isEditMode}
        />

        <div className="flex min-h-[calc(100vh-7.5rem)]">
          <EditorSidebar />

          <div className="flex-1 p-5 md:p-7 lg:p-9 min-w-0">
            <PanelGroup direction="horizontal" className="h-[calc(100vh-10rem)] min-h-[calc(100vh-10rem)]">
              <Panel defaultSize={50} minSize={30} className="h-full">
                <section 
                  className="min-w-0 pr-3 h-full overflow-y-auto"
                  ref={editorScrollRef}
                  onScroll={() => handleScroll('editor')}
                >
                  <EditorCanvas
                    content={content}
                    onChange={setContent}
                  />
                </section>
              </Panel>

              <PanelResizeHandle className="w-px self-stretch bg-border hover:bg-foreground/30 transition-colors" />

              <Panel defaultSize={50} minSize={25} className="h-full">
                <aside 
                  className="min-w-0 pl-3 h-full overflow-y-auto"
                  ref={previewScrollRef}
                  onScroll={() => handleScroll('preview')}
                >
                  <h3 className="text-sm text-muted-foreground mb-4">미리보기</h3>
                  <article className="prose prose-lg dark:prose-invert max-w-none">
                    <h1>{deferredTitle || '제목 없음'}</h1>
                    <ContentRenderer content={deferredContent} plainReadOnlyInteractive />
                  </article>
                </aside>
              </Panel>
            </PanelGroup>
          </div>
        </div>

        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent className="max-w-2xl">
            <DialogTitle>포스트 발행</DialogTitle>
            
            <div className="space-y-6 py-4">
              <div>
                <Label>타이틀</Label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    validateTitleInput(e.target.value);
                  }}
                  placeholder="타이틀 입력..."
                  className="mt-2"
                />
                {titleError && (
                  <p className="mt-2 text-sm text-destructive">{titleError}</p>
                )}
              </div>

              <div>
                <Label>썸네일 이미지 파일</Label>
                <Input
                  type="file"
                  accept="image/*"
                  className="mt-2"
                  disabled={isUploadingThumbnail}
                  onChange={(e) => handleThumbnailFileSelect(e.target.files?.[0] || null)}
                />
                {isUploadingThumbnail && (
                  <p className="mt-2 text-sm text-muted-foreground">이미지 업로드 중...</p>
                )}
                {thumbnail && (
                  <div className="mt-3 relative w-full h-48 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={thumbnail}
                      alt="Thumbnail preview"
                      className="w-full h-full object-cover"
                      onError={() => {
                        toast.error('썸네일 미리보기를 불러오지 못했습니다. 파일을 다시 업로드해주세요.');
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <Label>태그</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== 'Enter') return;
                      if ((e.nativeEvent as KeyboardEvent).isComposing) return;
                      e.preventDefault();
                      handleAddTag();
                    }}
                    placeholder="태그 입력..."
                  />
                  <Button onClick={handleAddTag}>추가</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="px-3 py-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-2 hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>시리즈 이름 (선택)</Label>
                <Input
                  value={seriesName}
                  onChange={(e) => {
                    const nextSeriesName = e.target.value;
                    setSeriesName(nextSeriesName);
                    validateSeriesNameInput(nextSeriesName);
                  }}
                  placeholder="시리즈 이름 입력..."
                  className="mt-2"
                />
                {seriesNameError && (
                  <p className="mt-2 text-sm text-destructive">{seriesNameError}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowPublishDialog(false)} disabled={isPublishing}>
                취소
              </Button>
              <Button onClick={() => void handlePublish()} disabled={isPublishing}>
                {isPublishing ? '처리 중...' : slug ? '수정하기' : '발행하기'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={showDraftListDialog} onOpenChange={setShowDraftListDialog}>
          <DialogContent className="max-w-2xl">
            <DialogTitle>임시저장</DialogTitle>

            <div className="space-y-4 py-2">
              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <p className="text-sm text-muted-foreground">새 글을 시작하거나, 기존 임시저장을 이어서 수정할 수 있어요.</p>
                <Button type="button" variant="outline" size="sm" onClick={handleCreateNewDraft}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  새로 만들기
                </Button>
              </div>

              <div className="max-h-[360px] overflow-y-auto space-y-2">
                {draftList.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    저장된 임시글이 없습니다.
                  </div>
                ) : (
                  draftList.map((draft) => (
                    <div
                      key={draft.id}
                      className="w-full rounded-md border border-border p-3 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => handleSelectDraft(draft.id)}
                          className="min-w-0 text-left"
                        >
                          <p className="font-medium truncate">
                            {draft.title.trim() || '제목 없는 임시글'}
                          </p>
                        </button>

                        <div className="flex items-center gap-2">
                          {currentDraftId === draft.id && (
                            <Badge variant="secondary">현재 작업중</Badge>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleDeleteDraft(draft.id)}
                            aria-label="임시저장 삭제"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(draft.updatedAt).toLocaleString('ko-KR')} · 블록 {draft.content.length}개
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DndProvider>
  );
}
