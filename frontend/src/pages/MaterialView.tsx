import { ArrowLeft, BookOpen, Loader2, MessageSquare, RefreshCw, Trash2 } from "lucide-react"
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

  // Refetch material when status changes to completed
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
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    )
  }

  if (!material) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Material not found</h2>
          <Link to="/">
            <Button variant="outline">
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{material.title}</h1>
              <p className="text-sm text-muted-foreground">
                {material.source_type === "youtube" ? "YouTube Video" : "Document"}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>

        {/* Processing Status */}
        {currentStatus === "processing" && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Processing your content...</h3>
                <p className="text-muted-foreground">
                  We're extracting vocabulary from your content. This may take a few moments.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStatus === "pending" && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Ready to process</h3>
                <p className="text-muted-foreground mb-4">
                  Click the button below to start extracting vocabulary
                </p>
                <Button onClick={handleRetry} disabled={processMaterial.isPending}>
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
          <Card className="border-red-200">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2 text-red-600">
                  Processing failed
                </h3>
                <p className="text-muted-foreground mb-4">
                  There was an error processing your content. Please try again.
                </p>
                <Button onClick={handleRetry} disabled={processMaterial.isPending}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Content Display */}
        {currentStatus === "completed" && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="flashcards">
                Flashcards ({material.flashcards?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="quiz">
                <BookOpen className="h-4 w-4 mr-1" />
                Quiz
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-1" />
                Chat
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="mt-4">
              <Card className="max-h-[600px] overflow-hidden">
                <CardHeader>
                  <CardTitle>Source Text</CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto max-h-[500px]">
                  <p className="text-sm whitespace-pre-wrap">
                    {material.processed_text || "No text content available"}
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="flashcards" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>
                    Vocabulary ({material.flashcards?.length || 0} cards)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {material.flashcards && material.flashcards.length > 0 ? (
                    <div className="space-y-4 max-h-[500px] overflow-auto">
                      {material.flashcards.map((card) => (
                        <Card key={card.id} className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold">{card.term}</h4>
                              <p className="text-sm text-muted-foreground">
                                {card.translation}
                              </p>
                            </div>
                            {card.grammar_note && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {card.grammar_note}
                              </span>
                            )}
                          </div>
                          {card.definition && (
                            <p className="text-sm mt-2">{card.definition}</p>
                          )}
                          {card.context_original && (
                            <p className="text-sm text-muted-foreground mt-2 italic">
                              "{card.context_original}"
                            </p>
                          )}
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No flashcards generated
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="quiz" className="mt-4">
              <QuizComponent
                materialId={id!}
                onClose={() => {}}
              />
            </TabsContent>

            <TabsContent value="chat" className="mt-4">
              <ChatComponent
                materialId={id!}
                materialTitle={material.title}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  )
}
