import client from './client'
import type { Todo, TodoCreatePayload, TodoPatchPayload } from '../types'

export const todoApi = {
  create: (data: TodoCreatePayload) =>
    client.post<Todo>('/todos', data),

  getByRange: (from: string, to: string) =>
    client.get<Todo[]>('/todos/range', { params: { from, to } }),

  patch: (todoId: number, data: TodoPatchPayload) =>
    client.patch<Todo>(`/todos/${todoId}`, data),

  delete: (todoId: number) =>
    client.delete(`/todos/${todoId}`),

  complete: (todoId: number) =>
    client.patch<Todo>(`/todos/${todoId}/complete`),

  uncomplete: (todoId: number) =>
    client.patch<Todo>(`/todos/${todoId}/uncomplete`),
}
