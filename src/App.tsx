import React from "react";
import "./vendor/gifshot";
import "./App.css";
import sparkle1 from "./sparkle1.svg";
import sparkle2 from "./sparkle2.svg";
import "rsuite/dist/styles/rsuite-default.css";
import {
  Button,
  Col,
  ControlLabel,
  Form,
  FormControl,
  FormGroup,
  Grid,
  RangeSlider,
  Row,
  Slider,
} from "rsuite";
import { useDebounce } from "./vendor/useDebounce";

type AddGlitterOptions = {
  x: number;
  y: number;
  width: number;
  height: number;
  density: number;
  lightnessRange: [number, number];
  opacity: number;
};
type UserConfigurableAddGlitterOptions = Pick<
  AddGlitterOptions,
  "density" | "lightnessRange" | "opacity"
>;

const addGlitter = (
  ctx: CanvasRenderingContext2D,
  options: AddGlitterOptions
) => {
  for (let x = options.x; x < options.width; x += 1) {
    for (let y = options.y; y < options.height; y += 1) {
      if (Math.random() > options.density) {
        continue;
      }
      const lightness = Math.floor(
        Math.random() *
          (options.lightnessRange[1] - options.lightnessRange[0]) +
          options.lightnessRange[0]
      );
      const r = lightness;
      const g = r;
      const b = r;
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

type UserConfigurableAddSparklesOptions = Pick<
  AddSparklesOptions,
  "density" | "sizeRange" | "alphaRange"
>;

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
      ctx.drawImage(image, x - size / 2, y - size / 2, size, size);
      ctx.globalAlpha = prevAlpha;
      ctx.rotate(-rotation);
    }
  }
};

const drawImageWithFilters = async (
  img: HTMLImageElement,
  ctx: CanvasRenderingContext2D,
  opts: {
    glitterOptions: UserConfigurableAddGlitterOptions;
    sparkleOptions: UserConfigurableAddSparklesOptions;
  }
) => {
  const width = img.width;
  const height = img.width;
  ctx.drawImage(img, 0, 0);
  addGlitter(ctx, {
    x: 0,
    y: 0,
    width,
    height,
    ...opts.glitterOptions,
  });
  await addSparkles(ctx, {
    x: 0,
    y: 0,
    width,
    height,
    ...opts.sparkleOptions,
  });
};

const createFrames = async (
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  opts: {
    glitterOptions: UserConfigurableAddGlitterOptions;
    sparkleOptions: UserConfigurableAddSparklesOptions;
  }
) => {
  const frames: string[] = [];
  const ctx = canvas.getContext("2d")!;
  for (let i = 0; i < 5; i++) {
    await drawImageWithFilters(img, ctx, opts);
    frames.push(canvas.toDataURL("image/png"));
  }
  return frames;
};

function App() {
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const previewCanvas = React.useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [outputSrc, setOutputSrc] = React.useState<string | null>(null);

  const [glitterOptions, setGlitterOptions] = React.useState<
    UserConfigurableAddGlitterOptions
  >({ density: 0.3, lightnessRange: [105, 185], opacity: 0.3 });

  const debouncedGlitterOptions = useDebounce(glitterOptions, 300);

  const [sparkleOptions, setSparkleOptions] = React.useState<
    UserConfigurableAddSparklesOptions
  >({ density: 0.001, sizeRange: [10, 70], alphaRange: [0.3, 0.9] });

  const debouncedSparkleOptions = useDebounce(sparkleOptions, 300);

  const [
    uploadedImage,
    setUploadedImage,
  ] = React.useState<HTMLImageElement | null>(null);

  React.useEffect(() => {
    if (!uploadedImage) return;
    const ctx = previewCanvas.current!.getContext("2d")!;
    drawImageWithFilters(uploadedImage, ctx, {
      glitterOptions: debouncedGlitterOptions,
      sparkleOptions: debouncedSparkleOptions,
    });
  }, [uploadedImage, debouncedGlitterOptions, debouncedSparkleOptions]);

  return (
    <div className="App">
      <div style={{ textAlign: "center", marginTop: 80 }}>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            if (!e.target.files) {
              return;
            }
            setOutputSrc(null);
            setUploadedImage(null);
            var reader = new FileReader();
            reader.onload = (event) => {
              var img = new Image();
              img.onload = async () => {
                setUploadedImage(img);
                canvas.current!.width = img.width;
                canvas.current!.height = img.height;
                previewCanvas.current!.width = img.width;
                previewCanvas.current!.height = img.height;
              };
              img.src = event.target!.result! as string;
            };
            reader.readAsDataURL(e.target.files[0]);
          }}
        />
      </div>
      <Grid style={{ marginTop: 32 }}>
        <Row gutter={16}>
          <Col md={6}>
            <h2>Glitter!</h2>
            <Form
              formValue={glitterOptions}
              onChange={(formValue) => {
                setGlitterOptions(formValue as typeof glitterOptions);
              }}
            >
              <FormGroup>
                <ControlLabel>Density</ControlLabel>
                <FormControl
                  name="density"
                  // @ts-ignore
                  accepter={Slider}
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: 200, margin: "10px 0" }}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Opacity</ControlLabel>
                <FormControl
                  name="opacity"
                  // @ts-ignore
                  accepter={Slider}
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: 200, margin: "10px 0" }}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Lightness Range</ControlLabel>
                <FormControl
                  name="lightnessRange"
                  // @ts-ignore
                  accepter={RangeSlider}
                  min={0}
                  max={255}
                  step={1}
                  style={{ width: 200, margin: "10px 0" }}
                />
              </FormGroup>
            </Form>
            <h2 style={{ marginTop: 16 }}>Sparkles!</h2>
            <Form
              formValue={sparkleOptions}
              onChange={(formValue) => {
                setSparkleOptions(formValue as typeof sparkleOptions);
              }}
            >
              <FormGroup>
                <ControlLabel>Density</ControlLabel>
                <FormControl
                  name="density"
                  // @ts-ignore
                  accepter={Slider}
                  min={0}
                  max={0.01}
                  step={0.001}
                  style={{ width: 200, margin: "10px 0" }}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Size</ControlLabel>
                <FormControl
                  name="sizeRange"
                  // @ts-ignore
                  accepter={RangeSlider}
                  min={0}
                  max={250}
                  step={10}
                  style={{ width: 200, margin: "10px 0" }}
                />
              </FormGroup>
              <FormGroup>
                <ControlLabel>Alpha</ControlLabel>
                <FormControl
                  name="alphaRange"
                  // @ts-ignore
                  accepter={RangeSlider}
                  min={0}
                  max={1}
                  step={0.1}
                  style={{ width: 200, margin: "10px 0" }}
                />
              </FormGroup>
            </Form>
          </Col>
          <Col md={18}>
            <h2>Preview!</h2>
            <canvas ref={previewCanvas} style={{ display: "block" }} />
            {uploadedImage && (
              <Button
                appearance="primary"
                size="lg"
                style={{ marginTop: 16 }}
                onClick={async () => {
                  if (!uploadedImage) return;
                  setOutputSrc(null);
                  setIsLoading(true);
                  const ctx = canvas.current!.getContext("2d");
                  if (!ctx) return;
                  const frames = await createFrames(
                    canvas.current!,
                    uploadedImage,
                    {
                      glitterOptions,
                      sparkleOptions,
                    }
                  );
                  // @ts-ignore
                  window.gifshot.createGIF(
                    {
                      images: frames,
                      gifWidth: uploadedImage.width,
                      gifHeight: uploadedImage.height,
                    },
                    // @ts-ignore
                    function (obj) {
                      if (!obj.error) {
                        setOutputSrc(obj.image);
                      }
                      setIsLoading(false);
                    }
                  );
                }}
                disabled={isLoading}
              >
                Go!
              </Button>
            )}
            {isLoading && <p>Please wait for sparkles...</p>}
            {outputSrc && (
              <>
                <h2 style={{ marginTop: 16 }}>Result!</h2>
                <img src={outputSrc} alt="your sparkles" />
              </>
            )}
          </Col>
        </Row>
      </Grid>
      <canvas ref={canvas} style={{ display: "none" }} />
      <br />
    </div>
  );
}

export default App;
