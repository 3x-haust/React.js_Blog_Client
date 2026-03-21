import { Post } from '../types';

export const samplePosts: Post[] = [
  {
    id: '4',
    slug: 'interactive-ui-components-guide',
    title: '🎮 Interactive UI Components: A Practical Guide',
    thumbnail: 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&h=400&fit=crop',
    tags: ['React', 'UI', 'Interactive', 'Tutorial'],
    createdAt: '2026-03-20T16:20:00Z',
    updatedAt: '2026-03-20T16:20:00Z',
    views: 2156,
    heartCount: 45,
    readingTime: 15,
    content: [
      {
        id: 'e1',
        type: 'heading',
        content: '인터랙티브 학습의 힘',
        metadata: { level: 2 },
      },
      {
        id: 'e2',
        type: 'paragraph',
        content: '이 포스트의 모든 예제는 직접 실행하고 조작할 수 있습니다. 코드와 결과를 동시에 보면서 실시간으로 배워보세요!',
      },
      {
        id: 'e3',
        type: 'callout',
        content: '🎮 모든 예제는 읽기 전용 모드로 코드를 볼 수 있지만 수정은 불가능합니다. 안전하게 인터랙션만 즐겨보세요!',
        metadata: { variant: 'info' },
      },
      {
        id: 'e4',
        type: 'heading',
        content: '1. 폼 컨트롤 데모 🎛️',
        metadata: { level: 2 },
      },
      {
        id: 'e5',
        type: 'paragraph',
        content: '체크박스, 슬라이더, 라디오 버튼 등 다양한 폼 컨트롤을 직접 조작해보세요:',
      },
      {
        id: 'e6',
        type: 'interactive',
        content: `function FormControls() {
  const [checked, setChecked] = useState(false);
  const [value, setValue] = useState(50);
  const [option, setOption] = useState('option1');
  
  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>폼 컨트롤 데모</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-2">
          <Switch 
            checked={checked} 
            onCheckedChange={setChecked}
          />
          <Label>다크모드 {checked ? 'ON' : 'OFF'}</Label>
        </div>
        
        <div className="space-y-2">
          <Label>밝기: {value}%</Label>
          <Slider 
            value={[value]} 
            onValueChange={(v) => setValue(v[0])}
            max={100}
          />
        </div>
        
        <RadioGroup value={option} onValueChange={setOption}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option1" id="option1" />
            <Label htmlFor="option1">옵션 1</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="option2" id="option2" />
            <Label htmlFor="option2">옵션 2</Label>
          </div>
        </RadioGroup>
        
        <div className="p-4 bg-muted rounded-lg">
          <p className="font-medium">선택된 옵션: {option}</p>
        </div>
      </CardContent>
    </Card>
  );
}`,
        metadata: { editable: false },
      },
      {
        id: 'e7',
        type: 'heading',
        content: '2. 애니메이션 카드 💫',
        metadata: { level: 2 },
      },
      {
        id: 'e8',
        type: 'paragraph',
        content: '부드러운 애니메이션 효과를 확인해보세요:',
      },
      {
        id: 'e9',
        type: 'interactive',
        content: `function AnimatedCard() {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.05 }}
      className="cursor-pointer"
    >
      <Card className="p-6 bg-foreground">
        <CardContent className="text-center text-white">
          <motion.div
            animate={{ 
              rotate: isHovered ? 360 : 0,
              scale: isHovered ? 1.2 : 1
            }}
            transition={{ duration: 0.5 }}
            className="text-6xl mb-4"
          >
            ✨
          </motion.div>
          <h3 className="text-2xl font-bold">
            {isHovered ? '마우스를 올려보세요!' : '호버 효과'}
          </h3>
        </CardContent>
      </Card>
    </motion.div>
  );
}`,
        metadata: { editable: false },
      },
      {
        id: 'e10',
        type: 'heading',
        content: '3. 실시간 입력 🖊️',
        metadata: { level: 2 },
      },
      {
        id: 'e11',
        type: 'paragraph',
        content: '입력한 텍스트가 실시간으로 반영되는 것을 확인해보세요:',
      },
      {
        id: 'e12',
        type: 'interactive',
        content: `function LiveInput() {
  const [text, setText] = useState('안녕하세요!');
  
  return (
    <Card className="p-6">
      <CardContent className="space-y-4">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="텍스트를 입력하세요..."
          className="text-lg"
        />
        <motion.div
          key={text}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-8 bg-foreground text-background text-center"
        >
          <p className="text-3xl font-bold break-words">
            {text || '텍스트를 입력해주세요...'}
          </p>
          <p className="text-sm mt-2 opacity-80">
            글자 수: {text.length}
          </p>
        </motion.div>
      </CardContent>
    </Card>
  );
}`,
        metadata: { editable: false },
      },
      {
        id: 'e13',
        type: 'heading',
        content: '4. 인터랙티브 카운터 🔢',
        metadata: { level: 2 },
      },
      {
        id: 'e14',
        type: 'paragraph',
        content: '버튼을 클릭해서 숫자를 조작해보세요:',
      },
      {
        id: 'e15',
        type: 'interactive',
        content: `function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <Card className="p-6">
      <CardContent className="space-y-6">
        <motion.div
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <div className="text-7xl font-bold text-foreground">
            {count}
          </div>
        </motion.div>
        
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={() => setCount(count - 1)}
            variant="outline"
            size="lg"
          >
            -1
          </Button>
          <Button 
            onClick={() => setCount(0)}
            variant="outline"
            size="lg"
          >
            초기화
          </Button>
          <Button 
            onClick={() => setCount(count + 1)}
            size="lg"
          >
            +1
          </Button>
        </div>
        
        <div className="text-center text-sm text-muted-foreground">
          버튼을 클릭해서 숫자를 바꿔보세요!
        </div>
      </CardContent>
    </Card>
  );
}`,
        metadata: { editable: false },
      },
      {
        id: 'e16',
        type: 'quote',
        content: '보고 듣는 것보다 직접 만져보고 실험하는 것이 가장 빠른 학습입니다.',
      },
      {
        id: 'e17',
        type: 'callout',
        content: '💡 모든 예제는 읽기 전용이지만 인터랙션은 가능합니다. 실제 동작하는 컴포넌트를 직접 사용해보세요!',
        metadata: { variant: 'success' },
      },
    ],
  },
  {
    id: '1',
    slug: 'react-server-components-deep-dive',
    title: 'React Server Components: A Deep Dive',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=400&fit=crop',
    tags: ['React', 'Next.js', 'Server Components'],
    createdAt: '2026-03-15T10:00:00Z',
    updatedAt: '2026-03-15T10:00:00Z',
    views: 1234,
    heartCount: 23,
    readingTime: 8,
    content: [
      {
        id: 'b1',
        type: 'heading',
        content: 'Introduction',
        metadata: { level: 2 },
      },
      {
        id: 'b2',
        type: 'paragraph',
        content: 'React Server Components represent a paradigm shift in how we think about rendering in React applications. They allow us to build components that run exclusively on the server, reducing bundle size and improving performance.',
      },
      {
        id: 'b3',
        type: 'heading',
        content: 'Key Benefits',
        metadata: { level: 2 },
      },
      {
        id: 'b4',
        type: 'callout',
        content: 'Server Components can directly access backend resources like databases and file systems, eliminating the need for API routes in many cases.',
        metadata: { variant: 'info' },
      },
      {
        id: 'b5',
        type: 'code',
        content: `// Example Server Component
async function BlogPost({ slug }) {
  const post = await db.posts.findOne({ slug });
  
  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}`,
        metadata: { language: 'tsx' },
      },
      {
        id: 'b5b',
        type: 'heading',
        content: 'Interactive Demo',
        metadata: { level: 2 },
      },
      {
        id: 'b5c',
        type: 'paragraph',
        content: '직접 버튼을 눌러서 동작을 확인해보세요! 👇',
      },
      {
        id: 'b5d',
        type: 'interactive',
        content: `function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <Card className="p-6">
      <CardHeader>
        <CardTitle>인터랙티브 카운터</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-4xl font-bold text-center">
          {count}
        </div>
        <div className="flex gap-2 justify-center">
          <Button 
            onClick={() => setCount(count - 1)}
            variant="outline"
          >
            -1
          </Button>
          <Button 
            onClick={() => setCount(0)}
            variant="outline"
          >
            Reset
          </Button>
          <Button 
            onClick={() => setCount(count + 1)}
          >
            +1
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}`,
        metadata: { editable: false },
      },
      {
        id: 'b6',
        type: 'quote',
        content: 'The future of React is server-first, but client-interactive.',
      },
    ],
  },
  {
    id: '2',
    slug: 'typescript-advanced-patterns',
    title: 'Advanced TypeScript Patterns for Scale',
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=400&fit=crop',
    tags: ['TypeScript', 'Patterns', 'Best Practices'],
    createdAt: '2026-03-10T14:30:00Z',
    updatedAt: '2026-03-10T14:30:00Z',
    views: 892,
    heartCount: 18,
    readingTime: 12,
    content: [
      {
        id: 'c1',
        type: 'heading',
        content: 'Type-Safe State Machines',
        metadata: { level: 2 },
      },
      {
        id: 'c2',
        type: 'paragraph',
        content: 'When building complex applications, managing state transitions becomes critical. TypeScript discriminated unions provide an elegant solution.',
      },
      {
        id: 'c3',
        type: 'code',
        content: `type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: string }
  | { status: 'error'; error: Error };

function handleState(state: State) {
  switch (state.status) {
    case 'idle':
      return 'Ready to start';
    case 'loading':
      return 'Loading...';
    case 'success':
      return state.data;
    case 'error':
      return state.error.message;
  }
}`,
        metadata: { language: 'typescript' },
      },
    ],
  },
  {
    id: '3',
    slug: 'css-container-queries-revolution',
    title: 'CSS Container Queries: The Layout Revolution',
    thumbnail: 'https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=400&fit=crop',
    tags: ['CSS', 'Responsive Design', 'Modern Web'],
    createdAt: '2026-03-05T09:15:00Z',
    updatedAt: '2026-03-05T09:15:00Z',
    views: 567,
    heartCount: 15,
    readingTime: 6,
    content: [
      {
        id: 'd1',
        type: 'heading',
        content: 'Why Container Queries Matter',
        metadata: { level: 2 },
      },
      {
        id: 'd2',
        type: 'paragraph',
        content: 'Container queries allow components to adapt based on their container size, not just the viewport. This is a game-changer for truly modular, reusable components.',
      },
      {
        id: 'd3',
        type: 'code',
        content: `.card-container {
  container-type: inline-size;
  container-name: card;
}

.card {
  display: flex;
  flex-direction: column;
}

@container card (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}`,
        metadata: { language: 'css' },
      },
    ],
  },
];