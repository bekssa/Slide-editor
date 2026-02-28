import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PresentationProvider } from "./context/PresentationContext";
import Editor from "./pages/Editor";

function App() {
  return (
    <PresentationProvider>
      <TooltipProvider>
        <div className="dark">
          <Editor />
        </div>
        <Toaster />
      </TooltipProvider>
    </PresentationProvider>
  );
}

export default App;
