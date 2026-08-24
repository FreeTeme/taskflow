import { Input } from '../shared/Input'

interface TaskSearchProps {
  value: string
  onChange: (value: string) => void
}

export function TaskSearch({ value, onChange }: TaskSearchProps) {
  return (
    <Input
      label="Search tasks"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Search by title..."
    />
  )
}
