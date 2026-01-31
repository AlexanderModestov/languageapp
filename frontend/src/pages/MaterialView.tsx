import {
  ArrowLeft,
  BookOpen,
  FileText,
  Loader2,
  MessageSquare,
  RefreshCw,
  Trash2,
} from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"

import { ChatComponent } from "@/components/Chat"
import { Layout } from "@/components/Layout"
import { QuizComponent } from "@/components/Quiz"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  useDeleteMaterial,
  useMaterial,
  useMaterialStatus,
  useProcessMaterial,
} from "@/hooks/useMaterials"
import { cn } from "@/lib/utils"

const stageConfig = {
  new: { badge: "badge badge-info", label: "New" },
  learning: { badge: "badge badge-warning", label: "Learning" },
  review: { badge: "badge badge-neutral", label: "Review" },
  mastered: { badge: "badge badge-success", label: "Mastered" },
}

export function MaterialView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("content")

  const { data: material, isLoading, refetch } = useMaterial(id!)
  const { data: status } = useMaterialStatus(
    id!,
    material?.processing_status === "processing" ||
      material?.processing_status === "pending"
  )
  const processMaterial = useProcessMaterial()
  const deleteMaterial = useDeleteMaterial()

  useEffect(() => {
    if (status?.processing_status === "completed") {
      refetch()
    }
  }, [status?.processing_status, refetch])

  const handleRetry = async () => {
    if (id) {
      await processMaterial.mutateAsync(id)
    }
  }

  const handleDelete = async () => {
    if (id && confirm("Are you sure you want to delete this material?")) {
      await deleteMaterial.mutateAsync(id)
      navigate("/")
    }
  }

  const currentStatus = status?.processing_status || material?.processing_status

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <p className="text-sm text-muted-foreground">Loading material...</p>
        </div>
      </Layout>
    )
  }

  if (!material) {
    return (
      <Layout>
        <div className="text-center py-16 animate-fade-up">
          <div className="p-4 rounded-full bg-muted inline-block mb-4">
            <FileText className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Material not found</h2>
          <p className="text-muted-foreground mb-6">
            This material may have been deleted or doesn't exist.
          </p>
          <Link to="/">
            <Button variant="outline" className="hover-scale">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-up">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon" className="hover-scale">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                {material.title}
              </h1>
              <p className="text-sm text-muted-foreground">
                {material.source_type === "youtube" ? "YouTube Video" : "Document"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive transition-colors"
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Processing Status */}
        {currentStatus === "processing" && (
          <Card className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Processing your content...</h3>
                <p className="text-muted-foreground max-w-sm">
                  We're extracting vocabulary from your content. This may take a few moments.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === "pending" && (
          <Card className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="p-4 rounded-full bg-amber-50 dark:bg-amber-950 inline-block mb-4">
                  <FileText className="h-8 w-8 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to process</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  Click the button below to start extracting vocabulary
                </p>
                <Button
                  onClick={handleRetry}
                  disabled={processMaterial.isPending}
                  className="hover-scale"
                >
                  {processMaterial.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "Start Processing"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === "failed" && (
          <Card
            className="border-red-200 dark:border-red-900 animate-fade-up"
            style={{ animationDelay: "100ms" }}
          >
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="p-4 rounded-full bg-red-50 dark:bg-red-950 inline-block mb-4">
                  <FileText className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-red-600 dark:text-red-400">
                  Processing failed
                </h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                  There was an error processing your content. Please try again.
                </p>
                <Button
                  onClick={handleRetry}
                  disabled={processMaterial.isPending}
                  className="hover-scale"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Display */}
        {currentStatus === "completed" && (
          <div className="animate-fade-up" style={{ animationDelay: "100ms" }}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-11">
                <TabsTrigger value="content" className="text-sm">
                  Content
                </TabsTrigger>
                <TabsTrigger value="flashcards" className="text-sm">
                  Cards ({material.flashcards?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="quiz" className="text-sm">
                  <BookOpen className="h-4 w-4 mr-1.5" />
                  Quiz
                </TabsTrigger>
                <TabsTrigger value="chat" className="text-sm">
                  <MessageSquare className="h-4 w-4 mr-1.5" />
                  Chat
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="mt-6">
                <Card className="max-h-[600px] overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg">Source Text</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-auto max-h-[500px]">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {material.processed_text || "No text content available"}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flashcards" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Vocabulary ({material.flashcards?.length || 0} cards)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {material.flashcards && material.flashcards.length > 0 ? (
                      <div className="space-y-3 max-h-[500px] overflow-auto stagger-children-fast">
                        {material.flashcards.map((card) => (
                          <Card
                            key={card.id}
                            className="p-4 card-minimal hover:bg-secondary/50 transition-colors"
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="min-w-0">
                                <h4 className="font-semibold">{card.term}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {card.translation}
                                </p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {card.grammar_note && (
                                  <span className="badge badge-neutral text-xs">
                                    {card.grammar_note}
                                  </span>
                                )}
                                {card.stage && (
                                  <span
                                    className={cn(
                                      "text-xs",
                                      stageConfig[card.stage as keyof typeof stageConfig]?.badge ||
                                        "badge badge-neutral"
                                    )}
                                  >
                                    {stageConfig[card.stage as keyof typeof stageConfig]?.label ||
                                      card.stage}
                                  </span>
                                )}
                              </div>
                            </div>
                            {card.definition && (
                              <p className="text-sm mt-2">{card.definition}</p>
                            )}
                            {card.context_original && (
                              <p className="text-sm text-muted-foreground mt-2 italic border-l-2 border-muted pl-3">
                                "{card.context_original}"
                              </p>
                            )}
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="p-4 rounded-full bg-muted inline-block mb-4">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">No flashcards generated</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="quiz" className="mt-6">
                <QuizComponent materialId={id!} onClose={() => {}} />
              </TabsContent>

              <TabsContent value="chat" className="mt-6">
                <ChatComponent materialId={id!} materialTitle={material.title} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </Layout>
  )
}
