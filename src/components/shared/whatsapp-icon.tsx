/** WhatsApp-style chat bubble and telephone mark, using the surrounding text colour. */
export function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <path
        d="M20.5 11.7a8.5 8.5 0 0 1-12.6 7.5L3 20.5l1.3-4.8A8.5 8.5 0 1 1 20.5 11.7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.6 7.1c-.3-.5-.6-.5-.9-.5h-.6c-.3 0-.7.2-.9.5-.3.3-1 1-1 2.4s1 2.7 1.1 2.9c.2.2 2 3.1 4.9 4.2 2.4.9 2.9.7 3.4.6.5-.1 1.7-.7 1.9-1.3.3-.6.3-1.2.2-1.3-.1-.2-.3-.2-.6-.4l-1.8-.8c-.2-.1-.4-.1-.6.2l-.8.9c-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.2-1.4-.8-.7-1.3-1.6-1.5-1.8-.2-.3 0-.4.1-.6l.4-.5.3-.5c.1-.2 0-.4 0-.5l-.8-2.2Z"
        fill="currentColor"
        transform="translate(2 1) scale(.8)"
      />
    </svg>
  );
}
