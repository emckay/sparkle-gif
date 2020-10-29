import React from "react";
import "./vendor/gifshot";
import "./App.css"
import sparkle1 from "./sparkle1.svg";
import sparkle2 from "./sparkle2.svg";

type AddNoiseOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  density: number;
  sameRgb: boolean;
  opacity: number;
};

const addNoise = (ctx: CanvasRenderingContext2D, options: AddNoiseOptions) => {
  for (let x = options.x; x < options.width; x += 1) {
    for (let y = options.y; y < options.height; y += 1) {
      if (Math.random() > options.density) {
        continue;
      }
      let r, g, b: number;
      if (options.sameRgb) {
        r = Math.floor(Math.random() * 80 + 105);
        g = r;
        b = r;
      } else {
        r = Math.floor(Math.random() * 80 + 105);
        g = Math.floor(Math.random() * 80 + 105);
        b = Math.floor(Math.random() * 80 + 105);
      }
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${options.opacity})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
};

type AddSparklesOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  density: number;
  sizeRange: [number, number];
  alphaRange: [number, number];
};
const addSparkles = async (
  ctx: CanvasRenderingContext2D,
  options: AddSparklesOptions
) => {
  const sparkles: HTMLImageElement[] = [];
  sparkles[0] = new Image();
  sparkles[0].src = sparkle1;
  sparkles[1] = new Image();
  sparkles[1].src = sparkle2;
  await Promise.all(
    sparkles.map((img) => {
      return new Promise((resolve) => {
        img.onload = () => {
          resolve();
        };
      });
    })
  );

  for (let x = options.x; x < options.width; x += 1) {
    for (let y = options.y; y < options.height; y += 1) {
      if (Math.random() > options.density) {
        continue;
      }
      const size =
        Math.random() * (options.sizeRange[1] - options.sizeRange[0]) +
        options.sizeRange[0];
      const alpha =
        Math.random() * (options.alphaRange[1] - options.alphaRange[0]) +
        options.alphaRange[0];
      const rotation = Math.random() * Math.PI * 2;
      ctx.rotate(rotation);
      const prevAlpha = ctx.globalAlpha;
      ctx.globalAlpha = alpha;
      const image = sparkles[Math.floor(Math.random() * sparkles.length)];
      ctx.drawImage(image, x, y, size, size);
      ctx.globalAlpha = prevAlpha;
      ctx.rotate(-rotation);
    }
  }
};

const createFrames = async (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement
) => {
  const frames: string[] = [];
  const ctx = canvas.getContext("2d")!;
  const width = canvas.width;
  const height = canvas.width;

  for (let i = 0; i < 5; i++) {
    ctx.drawImage(img, 0, 0);
    addNoise(ctx, {
      x: 0,
      y: 0,
      width,
      height,
      density: 0.3,
      sameRgb: true,
      opacity: 0.3,
    });
    await addSparkles(ctx, {
      x: 0,
      y: 0,
      width,
      height,
      density: 0.001,
      sizeRange: [10, 70],
      alphaRange: [0.3, 0.9],
    });
    frames.push(canvas.toDataURL("image/png"));
  }
  return frames;
};

function App() {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [outputSrc, setOutputSrc] = React.useState<string | null>(null);
  return (
    <div className="App">
      <input
        type="file"
        accept="image/*"
        onChange={async (e) => {
          setIsLoading(true);
          setOutputSrc(null);
          if (!e.target.files) {
            return;
          }
          var reader = new FileReader();
          reader.onload = (event) => {
            var img = new Image();
            img.onload = async () => {
              canvas.current!.width = img.width;
              canvas.current!.height = img.height;
              const ctx = canvas.current!.getContext("2d");
              if (!ctx) return;
              const frames = await createFrames(canvas.current!, img);
              // @ts-ignore
              window.gifshot.createGIF(
                {
                  images: frames,
                  gifWidth: img.width,
                  gifHeight: img.height,
                },
                // @ts-ignore
                function (obj) {
                  if (!obj.error) {
                    setOutputSrc(obj.image);
                  }
                  setIsLoading(false);
                }
              );
            };
            img.src = event.target!.result! as string;
          };
          reader.readAsDataURL(e.target.files[0]);
        }}
      />
      <canvas ref={canvas} style={{ display: "none" }} />
      <br />
      {isLoading && "Please wait for sparkles"}
      {outputSrc && <img src={outputSrc} alt="your sparkles" />}
    </div>
  );
}

export default App;
