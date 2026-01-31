import { FileText, FolderOpen, Loader2, Plus, Search, Youtube } from "lucide-react"
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

const statusConfig = {
  pending: { badge: "badge badge-warning", label: "Pending" },
  processing: { badge: "badge badge-info", label: "Processing..." },
  completed: { badge: "badge badge-success", label: "Ready" },
  failed: { badge: "badge badge-destructive", label: "Failed" },
}

function MaterialCard({ material, index }: { material: Material; index: number }) {
  const config = statusConfig[material.processing_status]

  return (
    <Link
      to={`/material/${material.id}`}
      className="block"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Card className="card-interactive h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex-shrink-0 p-2 rounded-lg",
                  material.source_type === "youtube"
                    ? "bg-red-50 dark:bg-red-950"
                    : "bg-indigo-50 dark:bg-indigo-950"
                )}
              >
                {material.source_type === "youtube" ? (
                  <Youtube className="h-4 w-4 text-red-500" />
                ) : (
                  <FileText className="h-4 w-4 text-indigo-500" />
                )}
              </div>
              <CardTitle className="text-base font-semibold line-clamp-2 leading-tight">
                {material.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs">
              {new Date(material.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </CardDescription>
            <span className={config.badge}>{config.label}</span>
          </div>
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
        "px-3 py-1.5 text-sm font-medium rounded-full transition-all duration-200",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
      if (search && !material.title.toLowerCase().includes(search.toLowerCase())) {
        return false
      }
      if (sourceFilter !== "all" && material.source_type !== sourceFilter) {
        return false
      }
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
      <div className="space-y-8">
        {/* Header */}
        <div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-up"
        >
          <div>
            <h1 className="page-title">Library</h1>
            <p className="page-subtitle">
              {counts.total} items ({counts.youtube} videos, {counts.file} documents)
            </p>
          </div>
          <Button onClick={() => setShowUpload(true)} className="hover-scale">
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
        </div>

        {/* Search and Filters */}
        <div
          className="space-y-4 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-6">
            {/* Source Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Type:</span>
              <div className="flex gap-1.5">
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
              <span className="text-sm font-medium text-muted-foreground">Status:</span>
              <div className="flex gap-1.5 flex-wrap">
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
        <div
          className="animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading your library...</p>
            </div>
          ) : filteredMaterials.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {filteredMaterials.map((material, index) => (
                <MaterialCard key={material.id} material={material} index={index} />
              ))}
            </div>
          ) : materials && materials.length > 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No matches found</h3>
                <p className="text-muted-foreground text-center max-w-sm">
                  Try adjusting your search or filters to find what you're looking for
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <FolderOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Your library is empty</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Add YouTube videos or documents to start building your vocabulary
                </p>
                <Button onClick={() => setShowUpload(true)} className="hover-scale">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Content
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </Layout>
  )
}
