export interface User {
  id: string
  email: string
  password: string
  name: string
  role: "admin" | "user"
}
const DEMO_PASSWORD_HASH = "password@123"

const mockUsers: User[] = [
  {
    id: "user-001",
    email: "admin@example.com",
    password: DEMO_PASSWORD_HASH,
    name: "Admin User",
    role: "admin",
  },
  {
    id: "user-002",
    email: "user@example.com",
    password: DEMO_PASSWORD_HASH,
    name: "Demo User",
    role: "user",
  },
]

export async function getUser(email: string): Promise<User | undefined> {
  return mockUsers.find((u) => u.email === email)
}

export async function getUserById(id: string): Promise<User | undefined> {
  return mockUsers.find((u) => u.id === id)
}

export async function hashPassword(password: string): Promise<boolean> {
  return password == DEMO_PASSWORD_HASH;
}
