"use client";

import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, Upload, User } from "lucide-react";
function usersToCSV(users: User[]): string {
    const header = ["uid", "cn", "mail", "telephoneNumber", "mobile", "title", "departmentNumber"];
    const numericFields = new Set(["telephoneNumber", "mobile", "departmentNumber"]);
    const escape = (val: string, key: string) => {
        if (!val) return '""';
        let v = val.replace(/"/g, '""');
        if (numericFields.has(key) && v) v = ' ' + v;
        return '"' + v + '"';
    };
    const rows = users.map(u => header.map(h => escape(u[h as keyof User]?.toString() ?? "", h)));
    return '\uFEFFsep=;\r\n' + header.join(";") + '\r\n' + rows.map(r => r.join(";")).join("\r\n");
}

function csvToUsers(csv: string): User[] {
    let lines = csv.trim().split(/\r?\n/);
    let delimiter = ',';
    if (lines[0].toLowerCase().startsWith('sep=')) {
        delimiter = lines[0].slice(4, 5);
        lines = lines.slice(1);
    }
    const [headerLine, ...dataLines] = lines;
    const header = headerLine.split(delimiter).map(h => h.replace(/^"|"$/g, ""));
    function smartSplit(line: string, delim: string): string[] {
        const result = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"'; i++; // escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === delim && !inQuotes) {
                result.push(cur); cur = '';
            } else {
                cur += char;
            }
        }
        result.push(cur);
        return result;
    }
    return dataLines
        .map(line => line.replace(/^\uFEFF/, '')) // убрать BOM если есть
        .filter(line => line.trim().length > 0 && /[\wа-яА-ЯёЁ]/.test(line)) // пропускать пустые строки
        .map(line => {
            const fields = smartSplit(line, delimiter).map(f => f.replace(/^"|"$/g, "").replace(/""/g, '"'));
            while (fields.length < header.length) fields.push("");
            const u: any = {};
            header.forEach((h, i) => u[h] = fields[i] || "");
            return u as User;
        });
}
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

interface User {
    uid: string;
    cn: string;
    sn: string;
    dn: string;
    mail?: string;
    telephoneNumber?: string;
    mobile?: string;
    title?: string;
    departmentNumber?: string;
    role?: string;
}

export default function Dashboard() {
    const inputFileRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [editIdx, setEditIdx] = useState<number | null>(null);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [saving, setSaving] = useState(false);
    const router = useRouter();
    const [openAdd, setOpenAdd] = useState(false);
    const [newUser, setNewUser] = useState({
        cn: "",
        uid: "",
        sn: "",
        mail: "",
        telephoneNumber: "",
        mobile: "",
        title: "",
        departmentNumber: "",
    });

    const handleAddChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewUser({ ...newUser, [e.target.name]: e.target.value });
    };

    const handleAddSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch("/api/users/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
        });
        let result;
        try {
            result = await res.json();
        } catch {
            result = {};
        }
        if (res.ok) {
            setOpenAdd(false);
            setNewUser({
                cn: "",
                uid: "",
                sn: "",
                mail: "",
                telephoneNumber: "",
                mobile: "",
                title: "",
                departmentNumber: "",
            });
            toast.success('Пользователь добавлен');
            const usersRes = await fetch('/api/users');
            const usersData = await usersRes.json();
            setUsers(usersData.users || []);
        } else {
            alert("Ошибка добавления сотрудника" + (result.error || res.status));
        }
    };

    useEffect(() => {
        const check = async () => {
            try {
                const res = await fetch("/api/auth/me");
                if (!res.ok) {
                    router.replace("/");
                    return;
                }
            } finally {
                setLoading(false);
            }
        };
        check();
    }, [router]);

    useEffect(() => {
        if (!loading) {
            fetchUsers(search);
        }
        async function fetchUsers(searchValue: string) {
            try {
                const res = await fetch(`/api/users${searchValue ? `?search=${encodeURIComponent(searchValue)}` : ''}`);
                const data = await res.json();
                const usersWithRole = (data.users || []).map((u: User) => ({
                    ...u,
                    role: u.cn === 'admin' ? 'admin' : (u.cn === 'guest' ? 'guest' : 'guest')
                }));
                setUsers(usersWithRole);
            } catch { }
        }
    }, [loading, search]);

    const handleEdit = (idx: number) => {
        const user = users[idx];
        let uid = user.uid;
        if (!uid) {
            const found = users.find(u => u.cn === user.cn && u.uid);
            if (found) uid = found.uid;
        }
        setEditIdx(idx);
        setEditUser({ ...user, uid });
    };

    const handleCancel = () => {
        setEditIdx(null);
        setEditUser(null);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!editUser) return;
        setEditUser({ ...editUser, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        if (editIdx === null || !editUser) return;
        setSaving(true);
        try {
            const res = await fetch("/api/users/edit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editUser),
            });
            if (res.ok) {
                const updated = [...users];
                updated[editIdx] = editUser;
                setUsers(updated);
                setEditIdx(null);
                setEditUser(null);
                toast.success("Изменения успешно сохранены");
            } else {
                toast.error("Ошибка сохранения сотрудника");
            }
        } catch {
            toast.error("Ошибка сети при сохранении");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="relative p-5">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ФИО</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Мобильный</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Должность</TableHead>
                        <TableHead>Подразделение</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {[...Array(6)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-24 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-4 w-32 bg-muted/60 dark:bg-muted/30" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-20 bg-muted/60 dark:bg-muted/30" /></TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <div className="absolute inset-0 bg-white/70 dark:bg-black/30 z-10 pointer-events-none rounded-xl" />
        </div>
    );

    return (
        <div className="p-5">
            <input
                type="text"
                placeholder="Поиск..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="mb-4 px-3 py-2 border rounded w-full max-w-md"
            />
            <Toaster position="top-right" richColors closeButton />
            <div className="flex items-center gap-4 mb-4">
                <Button
                    type="button"
                    title="Экспорт CSV"
                    variant="outline"
                    onClick={() => {
                        const csv = usersToCSV(users);
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'users.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                >
                    <Download size={16} /> Экспорт
                </Button>
                <Button
                    variant="outline"
                    type="button"
                    onClick={() => inputFileRef.current?.click()}
                >
                    <Upload size={16} /> Импорт
                </Button>
                <input
                    ref={inputFileRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={async e => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const text = await file.text();
                        let imported: User[] = [];
                        try {
                            imported = csvToUsers(text);
                        } catch {
                            toast.error('Ошибка разбора CSV');
                            return;
                        }
                        if (!imported.length) {
                            toast.error('Нет данных для импорта');
                            return;
                        }
                        try {
                            const res = await fetch('/api/users/import', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(imported)
                            });
                            const result = await res.json();
                            if (!res.ok) {
                                toast.error('Ошибка сохранения: ' + (result.error || res.status));
                                return;
                            }
                            if (result.results && Array.isArray(result.results)) {
                                const created = result.results.filter((r: any) => r.status === 'created').length;
                                const updated = result.results.filter((r: any) => r.status === 'updated').length;
                                const errors = result.results.filter((r: any) => r.status === 'error');
                                toast.info(`Создано: ${created}, обновлено: ${updated}${errors.length ? ', ошибок: ' + errors.length : ''}`);
                                if (errors.length) {
                                    errors.forEach((e: any) => toast.error(`Ошибка для ${e.cn}: ${e.error}`));
                                }
                            } else {
                                toast.success('Импортировано сотрудников: ' + imported.length);
                            }
                            const usersRes = await fetch('/api/users');
                            const usersData = await usersRes.json();
                            setUsers(usersData.users || []);
                        } catch (err) {
                            toast.error('Ошибка сохранения на сервере');
                        }
                    }}
                />
                <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                    <DialogTrigger asChild>
                        <Button variant="outline">Добавить сотрудника</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Добавить сотрудника</DialogTitle>
                            <DialogDescription>
                                Заполните поля для добавления
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4">
                            <form onSubmit={handleAddSubmit} className="grid gap-4">
                                <div className="grid gap-3">
                                    <Label htmlFor="name-1">ФИО*</Label>
                                    <Input id="name-1" name="cn" value={newUser.cn} onChange={handleAddChange} required />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="telephone-1">Телефон</Label>
                                    <Input id="telephone-1" name="telephoneNumber" value={newUser.telephoneNumber} onChange={handleAddChange} />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="mobile-1">Мобильный</Label>
                                    <Input id="mobile-1" name="mobile" value={newUser.mobile} onChange={handleAddChange} />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="email-1">Email</Label>
                                    <Input id="email-1" name="mail" value={newUser.mail} onChange={handleAddChange} />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="-1">Должность</Label>
                                    <Input id="job-title-1" name="title" value={newUser.title} onChange={handleAddChange} />
                                </div>
                                <div className="grid gap-3">
                                    <Label htmlFor="subdivision-1">Подразделение</Label>
                                    <Input id="subdivision-1" name="departmentNumber" value={newUser.departmentNumber} onChange={handleAddChange} />
                                </div>
                            </form>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="outline">Отмена</Button>
                            </DialogClose>
                            <Button type="submit" onClick={handleAddSubmit}>Добавить</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>ФИО</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Мобильный</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Должность</TableHead>
                        <TableHead>Подразделение</TableHead>
                        <TableHead>Роль</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {users.map((u, i) => (
                        <TableRow key={i}>
                            {editIdx === i ? (
                                <>
                                    <input type="hidden" name="uid" value={editUser?.uid || ""} />
                                    <TableCell>
                                        <Input name="sn" value={editUser?.sn || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="telephoneNumber" value={editUser?.telephoneNumber || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="mobile" value={editUser?.mobile || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="mail" value={editUser?.mail || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="title" value={editUser?.title || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Input name="departmentNumber" value={editUser?.departmentNumber || ""} onChange={handleChange} />
                                    </TableCell>
                                    <TableCell>
                                        <Button onClick={handleSave} disabled={saving}>Сохранить</Button>
                                        <Button variant="secondary" onClick={handleCancel} disabled={saving}>Отмена</Button>
                                    </TableCell>
                                </>
                            ) : (
                                <>
                                    <TableCell>{u.sn || "—"}</TableCell>
                                    <TableCell>{u.telephoneNumber || "—"}</TableCell>
                                    <TableCell>{u.mobile || "—"}</TableCell>
                                    <TableCell>{u.mail || "—"}</TableCell>
                                    <TableCell>{u.title || "—"}</TableCell>
                                    <TableCell>{u.departmentNumber || "—"}</TableCell>
                                    <TableCell>{u.role || "—"}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <Button variant="outline" onClick={() => handleEdit(i)}>Редактировать</Button>
                                        <Button variant="destructive" onClick={async () => {
                                            if (!window.confirm(`Удалить пользователя ${u.sn || u.cn}?`)) return;
                                            try {
                                                const res = await fetch('/api/users/delete', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ dn: u.dn })
                                                });
                                                if (!res.ok) {
                                                    const err = await res.json();
                                                    toast.error('Ошибка удаления: ' + (err.error || res.status));
                                                    return;
                                                }
                                                toast.success('Пользователь удалён');
                                                // Обновить таблицу
                                                const usersRes = await fetch('/api/users');
                                                const usersData = await usersRes.json();
                                                setUsers(usersData.users || []);
                                            } catch {
                                                toast.error('Ошибка удаления на сервере');
                                            }
                                        }}>Удалить</Button>
                                    </TableCell>
                                </>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}