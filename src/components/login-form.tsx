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

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex justify-center flex-col", className)} {...props}>
      <Dialog>
        <DialogTrigger asChild>
          <Button className="rounded-[3px]" size="sm">Войти</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[365px]">
          <DialogHeader>
            <DialogTitle>Войдите в свой аккаунт</DialogTitle>
            <DialogDescription>
              Введите вашу почту, чтобы войти в аккаунт
            </DialogDescription>
          </DialogHeader>
          <form>
            <div className="flex flex-col gap-6">
              <div className="grid gap-3">
                <Label htmlFor="name">Имя пользователя</Label>
                <Input
                  id="name"
                  type="text"
                  required
                />
              </div>
              <div className="grid gap-3">
                <div className="flex items-center">
                  <Label htmlFor="password">Пароль</Label>
                </div>
                <Input id="password" type="password" required />
              </div>
              <div className="flex flex-col gap-3">
                <Button type="submit" className="w-full">
                  Войти
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
