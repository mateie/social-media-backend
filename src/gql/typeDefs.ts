export default `#graphql
scalar Object
scalar Upload

type Notification {
    id: String!
    body: String!
    username: String!
    user: User!
    createdAt: String!
    type: String!
    notifier: String!
    reference: String!
}

type Post {
    id: String!
    body: String!
    media: Media!
    isSpotlight: Boolean!
    spotlightAt: String!
    createdAt: String!
    poster: User!
    comments: [Comment]!
    likes: [Like]!
    dislikes: [Dislike]!
    likeCount: Int!
    dislikeCount: Int!
    commentCount: Int!
    lastInteraction: String!
}

type UserReport {
    id: String!
    username: String!
    user: User!
    reason: String!
    by: String!
    createdAt: String!
}

type PostReport {
    id: String!
    postId: String!
    post: Post!
    reason: String!
    by: String!
    createdAt: String!
}

type CommentReport {
    id: String!
    postId: String!
    commentId: String!
    comment: Comment!
    reason: String!
    by: String!
    createdAt: String!
}

type ReplyReport {
    id: String!
    postId: String!
    commentId: String!
    replyId: String!
    reply: Reply!
    reason: String!
    by: String!
    createdAt: String!
}

type Comment {
    id: String!
    createdAt: String!
    lastInteraction: String!
    commenter: User!
    likes: [Like]!
    dislikes: [Dislike]!
    replies: [Reply]!
    likeCount: Int!
    dislikeCount: Int!
    replyCount: Int!
    body: String!
}

type Reply {
    id: String!
    createdAt: String!
    lastInteraction: String!
    replier: User!
    to: User!
    likes: [Like]!
    dislikes: [Dislike]!
    likeCount: Int!
    dislikeCount: Int!
    body: String!
}

type Like {
    id: ID!
    createdAt: String!
    liker: User!
}

type Dislike {
    id: ID!
    createdAt: String!
    disliker: User!
}

type User {
    id: ID
    email: String
    username: String
    displayName: String
    createdAt: String
    bio: String
    avatar: String
    warns: [Warn]
    posts: [Post]
    followers: [Follow]
    following: [Follow]
    followerCount: Int
    followingCount: Int
    warnCount: Int
    type: String
    isMember: Boolean
    isBanned: Boolean
    banDuration: String
    lastIP: String
    lastActivity: String
    badges: [Badge]
    currentBadge: String
    spotlights: [Spotlight]
    nameBadge: String
    nameColor: String
}

type Follow {
    user: User!
    createdAt: String!
}

type Warn {
    by: String!
    reason: String!
    createdAt: String!
}

type Spotlight {
    id: ID!
    postID: String!
    createdAt: String!
}

type Badge {
    id: ID!
    badge: String!
    dateEarned: String!
}
type Media {
    filename: String!
    path: String!
    isVideo: Boolean!
}
input RegisterInput {
    username: String!
    password: String!
    confirmPassword: String!
    email: String!
}
type Query {
    getPosts: [Post]
    getFreshPosts(first: Int, offset: Int): [Post]
    getSpotlightPosts: [Post]
    getUserPosts(username: String!): [Post]
    getPost(postId: String!): Post
    getFollowingPosts(username: String!): [Post]
    getUsers: [User]
    getUser(username: String!): User
    getRanked: [Post]
    getRecentUsers: [User]
    getUserReports: [UserReport]
    getPostReports: [PostReport]
    getCommentReports: [CommentReport]
    getReplyReports: [ReplyReport]
    getNotifications(username: String!): [Notification]
}

type Mutation {
    authUser(token: String!): User!
    register(registerInput: RegisterInput): User!
    login(username: String!, password: String!): String!
    createPost(media: Upload!, body: String!): Post!
    deletePost(postId: String!): String!
    likePost(postId: String!): Post!
    dislikePost(postId: String!): Post!
    spotlightPost(postId: String!): Post!
    createComment(postId: String!, body: String!): Comment!
    deleteComment(postId: String!, commentId: String!): Post!
    likeComment(postId: String!, commentId: String!): Comment!
    dislikeComment(postId: String!, commentId: String!): Comment!
    createReply(postId: String!, commentId: String!, body: String!): Reply!
    deleteReply(postId: String!, commentId: String!, replyId: String!): Post!
    likeReply(postId: String!, commentId: String!, replyId: String!): Reply!
    dislikeReply(postId: String!, commentId: String!, replyId: String!): Reply!
    followUser(username: String!): User!
    reportUser(username: String!, reason: String!): String!
    reportPost(postId: String!, reason: String!): String!
    reportComment(commentId: String!, reason: String!): String!
    reportReply(replyId: String!, reason: String!): String!
    createNotification(username: String!, body: String!, type: String!): Notification!
    warnUser(username: String!, reason: String!): User!
    updateUser(newValues: Object!): User!
    updateUserAvatar(avatar: Upload!): User!
    deleteUser(username: String!): String!
}

type Subscription {
    createNotification: Notification!
}
`;