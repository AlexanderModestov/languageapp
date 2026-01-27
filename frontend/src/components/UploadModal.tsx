import { FileUp, Loader2, Upload, Youtube } from "lucide-react"
import { useCallback, useState } from "react"
import { useNavigate } from "react-router-dom"

import { useProcessMaterial, useUploadFile, useUploadYouTube } from "@/hooks/useMaterials"
import { cn } from "@/lib/utils"

import { Button } from "./ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Input } from "./ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"

interface UploadModalProps {
  onClose: () => void
}

export function UploadModal({ onClose }: UploadModalProps) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState("youtube")
  const [title, setTitle] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const uploadYouTube = useUploadYouTube()
  const uploadFile = useUploadFile()
  const processMaterial = useProcessMaterial()

  const isLoading =
    uploadYouTube.isPending || uploadFile.isPending || processMaterial.isPending

  const handleYouTubeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !youtubeUrl) return

    try {
      const material = await uploadYouTube.mutateAsync({ title, url: youtubeUrl })
      await processMaterial.mutateAsync(material.id)
      navigate(`/material/${material.id}`)
      onClose()
    } catch (error) {
      console.error("Failed to upload YouTube video:", error)
    }
  }

  const handleFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !file) return

    try {
      const material = await uploadFile.mutateAsync({ title, file })
      await processMaterial.mutateAsync(material.id)
      navigate(`/material/${material.id}`)
      onClose()
    } catch (error) {
      console.error("Failed to upload file:", error)
    }
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      if (!title) {
        setTitle(droppedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }, [title])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      if (!title) {
        setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""))
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <Card className="w-full max-w-lg mx-4">
        <CardHeader>
          <CardTitle>Add New Content</CardTitle>
          <CardDescription>
            Import content from YouTube or upload a document
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="youtube">
                <Youtube className="h-4 w-4 mr-2" />
                YouTube
              </TabsTrigger>
              <TabsTrigger value="file">
                <FileUp className="h-4 w-4 mr-2" />
                File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="youtube">
              <form onSubmit={handleYouTubeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Enter a title for this content"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">YouTube URL</label>
                  <Input
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !title || !youtubeUrl}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Add Video
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="file">
              <form onSubmit={handleFileSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Enter a title for this content"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Document</label>
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragging
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 hover:border-primary/50",
                      file && "border-primary bg-primary/5"
                    )}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => document.getElementById("file-input")?.click()}
                  >
                    <input
                      id="file-input"
                      type="file"
                      accept=".pdf,.docx,.doc,.txt,.md"
                      className="hidden"
                      onChange={handleFileChange}
                      disabled={isLoading}
                    />
                    {file ? (
                      <div className="flex flex-col items-center">
                        <FileUp className="h-8 w-8 text-primary mb-2" />
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Click or drag to replace
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <p className="font-medium">Drop your file here</p>
                        <p className="text-sm text-muted-foreground">
                          or click to browse (PDF, DOCX, TXT)
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading || !title || !file}>
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
