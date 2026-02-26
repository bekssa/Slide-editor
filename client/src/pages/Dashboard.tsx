import { useState } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Plus, MoreVertical, FileVideo, Trash2, Edit2, Loader2 } from "lucide-react";
import { usePresentations, useCreatePresentation, useDeletePresentation } from "@/hooks/use-presentations";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: presentations, isLoading } = usePresentations();
  const createMutation = useCreatePresentation();
  const deleteMutation = useDeletePresentation();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const p = await createMutation.mutateAsync({ title: newTitle });
      setIsCreateOpen(false);
      setNewTitle("");
      setLocation(`/editor/${p.id}`);
      toast({ title: "Presentation created" });
    } catch (e) {
      toast({ title: "Failed to create", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this presentation?")) {
      try {
        await deleteMutation.mutateAsync(id);
        toast({ title: "Presentation deleted" });
      } catch (e) {
        toast({ title: "Failed to delete", variant: "destructive" });
      }
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      
      <main className="container mx-auto px-4 sm:px-8 py-8 md:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Recent Presentations</h1>
            <p className="text-muted-foreground mt-1 text-sm">Manage and edit your slide decks</p>
          </div>
          
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="shadow-md hover:shadow-lg interactive-transition rounded-xl px-6"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Presentation
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          </div>
        ) : presentations?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-border rounded-2xl bg-card">
            <div className="bg-primary/5 p-4 rounded-full mb-4">
              <FileVideo className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-xl font-bold font-display text-foreground">No presentations yet</h3>
            <p className="text-muted-foreground max-w-sm mt-2 mb-6">
              Create your first presentation to start adding slides and content.
            </p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl">
              Create your first deck
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {presentations?.map((p) => (
              <div 
                key={p.id} 
                className="group relative bg-card rounded-2xl border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/20 interactive-transition overflow-hidden flex flex-col"
              >
                <div 
                  className="aspect-video bg-muted border-b border-border/50 flex items-center justify-center relative cursor-pointer"
                  onClick={() => setLocation(`/editor/${p.id}`)}
                >
                  <FileVideo className="h-12 w-12 text-muted-foreground/30 group-hover:text-primary/40 interactive-transition group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="p-4 flex items-start justify-between bg-card flex-1">
                  <div 
                    className="flex-1 cursor-pointer pr-4"
                    onClick={() => setLocation(`/editor/${p.id}`)}
                  >
                    <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.createdAt ? format(new Date(p.createdAt), "MMM d, yyyy") : 'Unknown date'}
                    </p>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground hover:text-foreground shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                      <DropdownMenuItem onClick={() => setLocation(`/editor/${p.id}`)}>
                        <Edit2 className="h-4 w-4 mr-2" /> Open
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDelete(p.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Create Presentation</DialogTitle>
          </DialogHeader>
          <div className="py-6">
            <Label htmlFor="title" className="text-sm font-medium mb-2 block">
              Presentation Title
            </Label>
            <Input
              id="title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Q4 Marketing Strategy"
              className="rounded-xl h-12"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={createMutation.isPending || !newTitle.trim()}
              className="rounded-xl"
            >
              {createMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
