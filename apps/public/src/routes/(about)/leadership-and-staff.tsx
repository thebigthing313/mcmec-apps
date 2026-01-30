import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(about)/leadership-and-staff')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(about)/leadership-and-staff"!</div>
}
