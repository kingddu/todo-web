import client from './client'
import type { Todo, TodoCreatePayload, TodoPatchPayload, TodoEditLog, TodoMemo } from '../types'

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

  search: (q: string) =>
    client.get<Todo[]>('/todos/search', { params: { q } }),

  getLogs: (todoId: number) =>
    client.get<TodoEditLog[]>(`/todos/${todoId}/logs`),

  getMemos: (todoId: number) =>
    client.get<TodoMemo[]>(`/todos/${todoId}/memos`),

  saveMemo: (todoId: number, content: string) =>
    client.post<TodoMemo>(`/todos/${todoId}/memos`, { content }),

  deleteMemo: (todoId: number) =>
    client.delete(`/todos/${todoId}/memos/me`),
}
