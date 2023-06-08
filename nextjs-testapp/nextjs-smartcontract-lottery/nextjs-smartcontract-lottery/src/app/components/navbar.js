import Link from "next/link";
export default function Navbar() {
  return (
    <div>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href="/about/us">About us</Link>
      <Link href="/about/someone">About Someone Else</Link>
      <Link href="/listofposts">About List</Link>
    </div>
  );
}
