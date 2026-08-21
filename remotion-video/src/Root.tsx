import { Composition } from "remotion";
import { MarujaBackground } from "./MarujaBackground";

// 6s loop @ 30fps
export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MarujaBackground}
    durationInFrames={240}
    fps={30}
    width={1920}
    height={1080}
  />
);
