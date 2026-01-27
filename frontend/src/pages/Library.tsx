import { FileText, Loader2, Plus, Search, Youtube } from "lucide-react"
import { useMemo, useState } from "react"
import { Link } from "react-router-dom"

import { Layout } from "@/components/Layout"
import { UploadModal } from "@/components/UploadModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useMaterials } from "@/hooks/useMaterials"
import type { Material } from "@/lib/api"
import { cn } from "@/lib/utils"

type SourceFilter = "all" | "youtube" | "file"
type StatusFilter = "all" | "pending" | "processing" | "completed" | "failed"

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
}

const statusLabels = {
  pending: "Pending",
  processing: "Processing...",
  completed: "Ready",
  failed: "Failed",
}

function MaterialCard({ material }: { material: Material }) {
  return (
    <Link to={`/material/${material.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {material.source_type === "youtube" ? (
                <Youtube className="h-5 w-5 text-red-500 flex-shrink-0" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500 flex-shrink-0" />
              )}
              <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
            </div>
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full flex-shrink-0",
                statusColors[material.processing_status]
              )}
            >
              {statusLabels[material.processing_status]}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs">
            Added {new Date(material.created_at).toLocaleDateString()}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-sm rounded-full transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      )}
    >
      {children}
    </button>
  )
}

export function Library() {
  const [showUpload, setShowUpload] = useState(false)
  const [search, setSearch] = useState("")
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const { data: materials, isLoading } = useMaterials()

  const filteredMaterials = useMemo(() => {
    if (!materials) return []

    return materials.filter((material) => {
      // Search filter
      if (search && !material.title.toLowerCase().includes(search.toLowerCase())) {
        return false
      }

      // Source type filter
      if (sourceFilter !== "all" && material.source_type !== sourceFilter) {
        return false
      }

      // Status filter
      if (statusFilter !== "all" && material.processing_status !== statusFilter) {
        return false
      }

      return true
    })
  }, [materials, search, sourceFilter, statusFilter])

  const counts = useMemo(() => {
    if (!materials) return { youtube: 0, file: 0, total: 0 }
    return {
      youtube: materials.filter((m) => m.source_type === "youtube").length,
      file: materials.filter((m) => m.source_type === "file").length,
      total: materials.length,
    }
  }, [materials])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Library</h1>
            <p className="text-muted-foreground">
              {counts.total} items ({counts.youtube} videos, {counts.file} documents)
            </p>
          </div>
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            {/* Source Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Type:</span>
              <div className="flex gap-1">
                <FilterButton
                  active={sourceFilter === "all"}
                  onClick={() => setSourceFilter("all")}
                >
                  All
                </FilterButton>
                <FilterButton
                  active={sourceFilter === "youtube"}
                  onClick={() => setSourceFilter("youtube")}
                >
                  YouTube
                </FilterButton>
                <FilterButton
                  active={sourceFilter === "file"}
                  onClick={() => setSourceFilter("file")}
                >
                  Files
                </FilterButton>
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Status:</span>
              <div className="flex gap-1">
                <FilterButton
                  active={statusFilter === "all"}
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </FilterButton>
                <FilterButton
                  active={statusFilter === "completed"}
                  onClick={() => setStatusFilter("completed")}
                >
                  Ready
                </FilterButton>
                <FilterButton
                  active={statusFilter === "processing"}
                  onClick={() => setStatusFilter("processing")}
                >
                  Processing
                </FilterButton>
                <FilterButton
                  active={statusFilter === "pending"}
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending
                </FilterButton>
                <FilterButton
                  active={statusFilter === "failed"}
                  onClick={() => setStatusFilter("failed")}
                >
                  Failed
                </FilterButton>
              </div>
            </div>
          </div>
        </div>

        {/* Materials Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredMaterials.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMaterials.map((material) => (
              <MaterialCard key={material.id} material={material} />
            ))}
          </div>
        ) : materials && materials.length > 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No matches found</h3>
              <p className="text-muted-foreground text-center">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Your library is empty</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add YouTube videos or documents to start learning
              </p>
              <Button onClick={() => setShowUpload(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Content
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </Layout>
  )
}
