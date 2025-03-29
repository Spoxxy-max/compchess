import { Link } from "react-router-dom";
import { Button } from '@/components/ui/button';
import { LucideArrowBigLeft } from "lucide-react";
const NotFound = () => {

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-300 mb-4">Oops! Page not found</p>
        <Button variant="solana" className="w-full">
          <Link to={'/'}>
            <LucideArrowBigLeft className="inline" /> <span>Back</span>
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
