"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function LoadingContent({ children }) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Delay 1 detik

    return () => clearTimeout(timer);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center">
        <div className="flex justify-center items-center progress"></div>
      </div>
    );
  }

  return children;
}
