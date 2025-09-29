"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import * as React from "react"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isAuth, setIsAuth] = React.useState<boolean>(false)

  React.useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          setIsAuth(!!data?.authenticated)
        }
      } catch {}
    }
    check()
  }, [])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Ошибка входа")
      } else {
        window.location.reload()
      }
    } catch (err) {
      setError("Ошибка сети")
    } finally {
      setSubmitting(false)
    }
  }

  async function onLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } finally {
      window.location.reload()
    }
  }

  return (
    <div className={cn("flex justify-center flex-col", className)} {...props}>
      {isAuth ? (
        <Button className="rounded-[3px]" size="sm" onClick={onLogout}>
          Выйти
        </Button>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-[3px]" size="sm">Войти</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[365px]">
            <DialogHeader>
              <DialogTitle>Войдите в свой аккаунт</DialogTitle>
              <DialogDescription>
                Введите ваши данные для входа
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onSubmit}>
              <div className="flex flex-col gap-4">
                {error && (
                  <div className="text-red-600 text-sm">{error}</div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="name">Имя пользователя</Label>
                  <Input
                    id="name"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Входим..." : "Войти"}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
