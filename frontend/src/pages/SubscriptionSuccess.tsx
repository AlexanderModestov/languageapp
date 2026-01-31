import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { Layout } from "@/components/Layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function SubscriptionSuccess() {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          navigate("/")
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-12">
        <Card>
          <CardContent className="pt-12 pb-8 text-center space-y-6">
            <div className="text-6xl">🎉</div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold">Welcome to Pro!</h1>
              <p className="text-muted-foreground">
                Your 7-day trial has started.
                <br />
                Enjoy unlimited uploads, AI chat, and more.
              </p>
            </div>

            <Button onClick={() => navigate("/")} size="lg">
              Go to Dashboard
            </Button>

            <p className="text-xs text-muted-foreground">
              Redirecting in {countdown} seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
