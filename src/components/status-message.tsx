interface Props {
  type: 'success' | 'error' | 'info';
  message: string;
}

const styles: Record<Props['type'], string> = {
  success: 'bg-green-50 border-green-300 text-green-800',
  error: 'bg-red-50 border-red-300 text-red-800',
  info: 'bg-blue-50 border-blue-300 text-blue-800',
};

export function StatusMessage({ type, message }: Props) {
  return (
    <div className={`border rounded px-4 py-3 text-sm ${styles[type]}`}>{message}</div>
  );
}
