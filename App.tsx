import React, { useState, useRef, useEffect } from "react";
import { ImageSize, ShootingPlanState, User } from "./types";
import {
  generateShootingPlan,
  generatePosePrompt,
  generateImageFromJsonPrompt,
} from "./services/geminiService";
import { Button } from "./components/Button";
import { Login } from "./components/Login";

/* ================= ICONS ================= */
const UploadIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>);
const CameraIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>);
const WandIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M3 21l9-9"/></svg>);
const SparkleIcon = () => (<span className="animate-pulse">✨</span>);

/* ================= APP ================= */
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const [state, setState] = useState<ShootingPlanState>({
    image: null,
    closeupImage: null,
    faceImage: null,
    context: "",
    modelStyle: "",
    planResult: null,
    isLoadingPlan: false,
    generatedImage: null,
    isGeneratingImage: false,
    imageSize: ImageSize.Size1K,
    error: null,
    suggestedContexts: [],
    isSuggestingContexts: false,
    suggestedModelStyles: [],
    isSuggestingModelStyles: false,
    posePrompts: {},
    generatingPosePromptId: null,
    poseImages: {},
    generatingPoseImageId: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  /* ================= AUTH ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("athea_user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem("athea_user", JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("athea_user");
  };

  /* ================= IMAGE UPLOAD ================= */
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;

      setState((p) => ({
        ...p,
        image: base64,
        isSuggestingContexts: true,
        isSuggestingModelStyles: true,
        suggestedContexts: [],
        suggestedModelStyles: [],
      }));

      try {
        const [ctxRes, styleRes] = await Promise.all([
          fetch("/api/suggest-contexts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          }),
          fetch("/api/suggest-model-styles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: base64 }),
          }),
        ]);

        const ctxData = await ctxRes.json();
        const styleData = await styleRes.json();

        setState((p) => ({
          ...p,
          suggestedContexts: ctxData.contexts || [],
          suggestedModelStyles: styleData.styles || [],
          isSuggestingContexts: false,
          isSuggestingModelStyles: false,
        }));
      } catch (err) {
        console.error(err);
        setState((p) => ({
          ...p,
          isSuggestingContexts: false,
          isSuggestingModelStyles: false,
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  /* ================= GENERATE PLAN ================= */
  const handleGeneratePlan = async () => {
    if (!state.image || !state.context || !state.modelStyle) return;

    setState((p) => ({ ...p, isLoadingPlan: true, error: null }));

    try {
      const plan = await generateShootingPlan(
        state.image,
        state.context,
        state.modelStyle,
        state.closeupImage,
        state.faceImage
      );

      setState((p) => ({ ...p, planResult: plan, isLoadingPlan: false }));
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      setState((p) => ({ ...p, isLoadingPlan: false, error: e.message }));
    }
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-gray-800 p-4 flex justify-between">
        <h1 className="text-xl font-serif">ATHEA Creative Director</h1>
        <button onClick={handleLogout}>Đăng xuất</button>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        <div className="border border-dashed p-6 text-center">
          <input ref={fileInputRef} type="file" onChange={handleImageUpload} hidden />
          <button onClick={() => fileInputRef.current?.click()}>
            <UploadIcon /> Upload ảnh sản phẩm
          </button>
        </div>

        {state.isSuggestingContexts && (
          <p className="mt-4 text-yellow-400"><SparkleIcon /> Đang gợi ý bối cảnh...</p>
        )}

        {state.suggestedContexts.length > 0 && (
          <div className="mt-4 flex gap-2 flex-wrap">
            {state.suggestedContexts.map((c) => (
              <button key={c} onClick={() => setState((p) => ({ ...p, context: c }))}>
                {c}
              </button>
            ))}
          </div>
        )}

        <Button
          onClick={handleGeneratePlan}
          disabled={!state.image || !state.context || !state.modelStyle}
          isLoading={state.isLoadingPlan}
        >
          <WandIcon /> Tạo kế hoạch
        </Button>

        {state.planResult && (
          <div ref={resultRef} className="mt-10 whitespace-pre-wrap">
            {state.planResult}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
