const getPostData = async () => {
  const res = await fetch("https://jsonplaceholder.typicode.com/posts");
  return res.json();
};

const getUsersData = async () => {
  const res = await fetch("https://jsonplaceholder.typicode.com/users");
  return res.json();
};

export default async function ListOfPosts() {
  const [posts, users] = await Promise.all([getPostData(), getUsersData()]);
  console.log(users);
  return (
    <div>
      {posts.map((post) => {
        return <p>{post.title}</p>;
      })}
    </div>
  );
}
