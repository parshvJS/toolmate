import { useRef, useEffect } from "react";
import { Link } from "react-router-dom";

export default function DemoVideo() {
    const videoRef = useRef<HTMLVideoElement | null>(null); // Type for video element

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        console.log("flag", entry.isIntersecting);

        if (entry.isIntersecting && videoRef.current) {
          videoRef.current.play(); // Start video when visible
        } else if (videoRef.current) {
          videoRef.current.pause(); // Pause video when not visible
        }
      },
      { threshold: 0.5 } // The video must be at least 50% visible
    );

    if (videoRef.current) {
      observer.observe(videoRef.current);
    }

    return () => {
      if (videoRef.current) {
        observer.unobserve(videoRef.current);
      }
    };
  }, []);

  return (
    <div className="md:p-14  border-1 border-slate-400 rounded-lg w-full h-full">
      <Link to="/preview" className="flex items-center gap-2 text-white rounded-md">
      <video
        ref={videoRef}
        src="public/sanoke.mp4"
        muted
        className="rounded-lg w-full h-auto"
      ></video>
      </Link>
    </div>
  );
}
