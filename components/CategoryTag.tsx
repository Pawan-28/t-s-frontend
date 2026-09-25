import Link from "next/link";

// Consistent low-saturation tint per category, cycled by name hash so the
// same category always gets the same color without a backend field for it.
const TINTS = [
  { bg: "bg-category-blue-bg", text: "text-category-blue-text" },
  { bg: "bg-category-teal-bg", text: "text-category-teal-text" },
  { bg: "bg-category-purple-bg", text: "text-category-purple-text" },
  { bg: "bg-category-green-bg", text: "text-category-green-text" },
];

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash + name.charCodeAt(i)) % TINTS.length;
  return TINTS[hash];
}

export default function CategoryTag({ name, slug }: { name: string; slug: string }) {
  const tint = tintFor(name);
  return (
    <Link
      href={`/category/${slug}`}
      className={`badge ${tint.bg} ${tint.text} hover:opacity-80`}
    >
      {name}
    </Link>
  );
}
