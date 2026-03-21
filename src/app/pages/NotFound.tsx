import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Home } from 'lucide-react';
import { Button } from '../components/ui/button';

export function NotFound() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-9xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
          404
        </h1>
        <h2 className="text-3xl mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-muted-foreground mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었습니다.
        </p>
        <Link to="/">
          <Button>
            <Home className="w-4 h-4 mr-2" />
            홈으로 돌아가기
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
