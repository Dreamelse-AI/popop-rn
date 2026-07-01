# 推荐页 / Story Bar 知识点总结

> 本文整理自一次围绕 popop-rn 推荐页(feed)与 Story Bar 的排查与答疑会话，涵盖：未读高亮逻辑、FE/RN 对齐、图片加载机制、分页机制、虚拟列表、以及一系列前端基础概念。
>
> 文档分两部分：
> - **上篇 · 问答原文**：原封不动保留本次会话的提问与回答。
> - **下篇 · 知识点总结**：对问答内容的结构化归纳。

---

# 上篇 · 问答原文

> 以下为本次会话的提问与回答原文记录（按时间顺序）。

## Q1. Story Bar 未读高亮来源

**提问：** 帮我判断一下，现在的推荐页顶部的限时动态（story bar）中，未读状态的高亮是否是根据 headline/list 中的 unread 字段决定的？还是说会读取本地存储？

**回答：**

已确认。结论是：**两者都参与，但服务端 `unread` 字段优先**，并不是单纯读本地存储。

判定逻辑集中在 `src/features/feed/story/headline-read.ts` 的 `isHeadlineCharacterUnread`：

```ts
export function isHeadlineCharacterUnread(
  item: StoryHeadline,
  read?: HeadlineReadSnapshot,
): boolean {
  if (item.unread) return true;
  if (!read) return false;
  if (read.isCharacterFullyRead(item.characterId)) return false;
  if (item.storyIds.length > 0) {
    return item.storyIds.some(id => !read.isStoryRead(id));
  }
  return false;
}
```

判定的优先级是这样的：

1. **服务端 `unread` 字段优先（始终为准）。** `item.unread` 来自 `GET /story/headline` 返回的 `StoryHeadlineItem.unread` 字段（IDL 定义在 `external/common-idl`，生成到 `src/generated/arca_apiComponents.ts`）。只要服务端说 `unread=true`，头像就一定高亮，本地存储无法覆盖它。这样能保证新帖、跨设备同步等场景正确。
2. **本地存储只在服务端 `unread=false` 时作补充。** 本地用的是 MMKV（`react-native-mmkv`，实例 `popop-default`，key `story_read_state`），由 zustand store `src/features/story/story-store.ts` 管理，记录已读 story id / 已读完的 character id / 续看指针。用户在 `story-viewer.tsx` 看过 story 后写入。它的作用是：当服务端没标未读时，根据本地"是否还有没看完的 story"决定是否仍显示高亮（比如续看场景）。
3. **拉取时会用服务端状态清理本地陈旧标记**（`syncHeadlineReadStateFromServer`），避免本地误判。

所以直接回答：**高亮不是"只看 headline/list 的 unread 字段"，也不是"只读本地存储"。它以服务端 `unread` 为准，本地 MMKV 仅在服务端 `unread=false` 时作为续看补充判断。**

## Q2. 与 FE 端是否一致

**提问：** 判断这里的实现逻辑与 fe 端是一致的吗？

**回答：**

确认了：**两端实现逻辑不一致**。

两个仓库里都有同一个文件 `features/feed/story/headline-read.ts`，但实现明显不同：

**FE 端（`popop-fe`）— 纯服务端驱动：**

```ts
/** 头像栏单项是否应展示为未读（高亮描边 + 排在未读区） */
export function isHeadlineCharacterUnread(item: StoryHeadline): boolean {
  return item.unread;
}
```

FE 的文件头注释也写得很明确：「未读高亮与排序均以 `GET /story/headline` 响应中的 `unread` 为准，**不读本地已读缓存**」。它的 `story-avatar.tsx` 调用是 `isHeadlineCharacterUnread(item)`，`story-bar-section.tsx` 是 `sortStoryHeadlineItems(data.items)`，都**不传任何本地快照**。

**RN 端（`popop-rn`）— 服务端 + 本地 MMKV 兜底：**

```ts
export function isHeadlineCharacterUnread(
  item: StoryHeadline,
  read?: HeadlineReadSnapshot,
): boolean {
  if (item.unread) return true;
  if (!read) return false;
  if (read.isCharacterFullyRead(item.characterId)) return false;
  if (item.storyIds.length > 0) {
    return item.storyIds.some(id => !read.isStoryRead(id));
  }
  return false;
}
```

**差异总结：**

| 维度 | FE | RN |
| --- | --- | --- |
| 函数签名 | `isHeadlineCharacterUnread(item)` | `isHeadlineCharacterUnread(item, read?)` |
| `unread=true` | 高亮 | 高亮(一致) |
| `unread=false` | 直接判已读 | 再查本地 MMKV，若仍有未看完的 story 则继续高亮 |
| 本地存储参与高亮 | 否 | 是(续看兜底) |
| 排序 | 按 `item.unread` | 按 `isHeadlineCharacterUnread(item, read)` |

**RN 比 FE 多了一层本地已读快照的兜底判断**（`unread=false` 时还会根据 MMKV 里的续看状态决定是否高亮），FE 则完全以服务端 `unread` 为准。两者在 `unread=true` 时行为相同，但在 `unread=false` 的续看场景下结果可能不同。

## Q3. 将 RN 与 FE 对齐为纯服务端驱动

**提问：** 帮我将 en 与 fe 对齐，即回到纯服务端驱动。

**回答：**

已对齐到 FE 的纯服务端驱动实现，没有 lint 错误。改了 4 个文件：

1. `headline-read.ts`（核心逻辑）—— `isHeadlineCharacterUnread` 现在直接 `return item.unread`，去掉了本地快照参数；`sortStoryHeadlineItems` 改回按 `item.unread` 排序。文件头注释也同步成「均以服务端 `unread` 为准，不读本地已读缓存」。`areAllHeadlineStoriesRead` 保留（viewer 续看本地逻辑仍在用，FE 也保留）。
2. `story-avatar.tsx` —— 移除 `useStoryReadStore` 依赖，`showUnreadRing = isHeadlineCharacterUnread(item)`。
3. `story-bar-section.tsx` —— 移除 `readStoryIds`/`fullyReadCharacterIds` 订阅与 `readSnapshot`，排序改成 `sortStoryHeadlineItems(data.items)`，`useMemo` 依赖也精简为 `[data?.items]`。
4. `index.ts` —— 移除 `HeadlineReadSnapshot` 类型导出（FE 没有这个类型）。

**保留未动的部分**（因为 FE 也是这样，属于 viewer 续看逻辑而非头像栏高亮）：
- `story-store.ts` 的 `syncHeadlineReadStateFromServer` 及 MMKV 已读存储
- `use-story-headline.ts` 里拉取后调用 `syncHeadlineReadStateFromServer(mapped.items)`

现在头像栏的未读高亮和排序完全由 `GET /story/headline` 的 `unread` 字段决定，与 FE 一致。本地 MMKV 已读状态不再参与头像栏高亮判断，只继续服务于 story viewer 的续看场景。

## Q4. 推荐页图片懒加载机制

**提问：** 帮我判断一下现在的推荐页是否有图片懒加载的机制，因为我看到我重新刷新之后，第一时间图片并不会显示，并且也没有占位，这样的效果是如何实现的？业界其它产品也是这样的效果吗？

**回答：**

**一、推荐页有没有图片懒加载机制？几乎没有。** 推荐页的图片加载是"裸加载"模式：

**1. 没有列表虚拟化** —— 用的是普通 `ScrollView` + 数组 `.map()`，不是 `FlatList`/`FlashList`：

```tsx
<ScrollView
  ref={feedScrollRef}
  style={styles.feedScroll}
  contentContainerStyle={styles.feedScrollContent}
  refreshControl={refreshControl}
  showsVerticalScrollIndicator={false}
  onScroll={handleFeedScroll}
  scrollEventThrottle={16}
>
  <TagFeed ref={tagFeedRef} />
</ScrollView>
```

所有 feed item 一次性全部 mount，没有 `windowSize`/`initialNumToRender`/`removeClippedSubviews` 这类窗口化参数。所谓"懒加载"只体现在**数据层的分页 load more**，而不是图片层的延迟挂载。

**2. feed 主图用的是 `expo-image` 裸 `Image`，没走封装的 `PopImage`**：

```tsx
{post.imageUrl ? (
  <Image
    source={{ uri: post.imageUrl }}
    style={styles.postImage}
    contentFit="cover"
    contentPosition="center"
    onLoad={handleImageLoad}
  />
```

它**没有**配置 `placeholder`、`transition`、`cachePolicy`、`recyclingKey` 任何一个。

**3. 没有任何占位** —— 图片容器 `imageWrapper` 也没有背景色。

**二、"刷新后图片不立即显示、也没占位"是怎么实现的？** 其实它不是刻意实现的效果，而是没做占位的自然结果：

1. 下拉刷新 → `useFeed().refresh()` 用 `replace=true` 整体替换 `items` 数组。
2. React 卸载旧的 `FeedPost`，挂载全新的 `<Image>`（新的 `uri`）。
3. 因为没有 `placeholder`、没有背景色、`transition` 默认是 `0`，所以图片在字节到达前就是一个透明空盒子，盖在页面 `#f7f7f7` 背景上。
4. `feed-post.tsx` 在 `onLoad` 里才测量图片真实宽高，加载完成前先占着固定高度 `POST_IMAGE_MAX_HEIGHT`（292）。
5. expo-image 默认 `cachePolicy: 'disk'`，看过的图能从缓存秒回；但刷新后往往是新帖/新 URL，没缓存，空白间隙就很明显，加载好是直接跳出来（没有淡入）。

一句话：**白屏 → 突然出现**，因为既无占位也无过渡。

**三、业界其它产品也是这样吗？不是。这是个体验缺陷，主流产品几乎都会做占位/过渡：**

- **模糊占位 (blurhash / thumbhash)**：Instagram、Medium、Unsplash 先显示低清模糊图，加载完渐变清晰。
- **骨架屏 / 纯色占位**：Twitter、小红书、Pinterest 先显示灰块或主色调。
- **渐显过渡 (fade)**：几乎所有产品给图片一个 200~300ms 淡入。

成熟产品的瀑布流通常用**虚拟化列表**（RN 里是 `FlashList`），配合 `recyclingKey` 复用图片视图。项目里其实已有 `PopImage` 封装（默认带 200ms 淡入），只是 feed 主图没用它，而且项目规则本身就要求网络图片用 `PopImage`——feed-post 这里违反了既有约定。

## Q5. 分页机制 / 刷新与加载更多 / 虚拟列表概念

**提问：**
（1）整个推荐页是否有分页机制？还是说从后端的 recommend 接口获取到数据后，直接一次性加载并渲染？
（2）刷新整个页面与下滑到底部加载更多的机制是否一致？因为我发现：当我刷新整个页面后，post 是没有图片占位的，而下滑加载更多时，是有一个空白占位元素的；
（3）react 中的虚拟列表是通过 react/virtual 实现的吗？而 RN 里是 FlashList？recyclingKey 是给每个 item 一个 key，从而在 diff 时判断是否是新增节点还是复用旧的节点的意思吗？

**回答：**

**(1) 有分页，是 cursor-based 的游标式增量分页，但要分两层：**

- **数据层：有分页。** 每次请求都带 `request_index`（页码）、`limit`（每页大小 `FEED_PAGE_SIZE`）和 `exclude_ids`（已展示过的 id，去重用）。`request_index` 在 initial/refresh 时重置为 1，load_more 时 +1。`hasMore` 由「本页返回的 post 数是否 ≥ 一页大小」推断（`setHasMore(postCount >= FEED_PAGE_SIZE)`）。
- **渲染层：无虚拟化。** 已拉到内存的 `items` 是全部一次性渲染的（普通 `ScrollView` + `.map()`）。分页只控制"什么时候拉下一批数据"，不控制"视图节点的挂载数量"。

一句话：**数据分页 ✅，视图虚拟化 ❌。**

**(2) 数据流是同一套（都走 `applyBatch`），关键差异是 `replace` 标志位：**

- **刷新**：`applyBatch(..., true, ...)` → 整个 `items` 数组被全新对象替换。
- **加载更多**：`applyBatch(..., false, ...)` → 新 item 追加到旧数组后面（`appendUniqueItems`）。

你看到的"占位有无差异"主要来自两个 UI 因素：

- **因素 A —— 加载更多时底部那个 spinner。** `loadingMore` 期间列表底部会渲染一个 `ActivityIndicator`（`loadingMoreContainer`，`paddingVertical: 20`），这就是你看到的"空白占位元素"。
- **因素 B —— 图片高度占位差异。** 每个 `FeedPost` 初始高度先撑到固定 292，`onLoad` 后才调整。刷新时新图多在首屏可视区内，看到"空框→突然出图"；加载更多时新 item 追加在屏幕外，先占住 292 空盒子，滚到时往往已加载好。

**结论：** 本质上两种情况都没有真正的图片占位（placeholder/blurhash），只是固定高度空盒子 + 底部 spinner 让"加载更多"看起来像有占位。

**(3) 虚拟列表 / FlashList / recyclingKey：**

- **React（Web）虚拟列表**：不是 React 自带，而是第三方库。主流是 `@tanstack/react-virtual`（原 react-virtual）、`react-window` / `react-virtualized`。
- **RN 虚拟列表**：内置 `FlatList`/`SectionList`（基于 `VirtualizedList`），社区高性能方案是 Shopify 的 `FlashList`。推荐页现在用 `ScrollView`，没用这些，所以没有虚拟化。
- **`recyclingKey` 的含义需要修正一个点**：它不是 React diff 用的 `key`：

| 概念 | 层面 | 作用 |
|---|---|---|
| React `key` | reconciler | 判断节点复用/新增/删除/重排 |
| `recyclingKey` | expo-image 渲染 | 视图被回收复用时，标记"换图了"，清掉旧图避免串图 |

在虚拟列表回收复用视图的场景下，同一个 `<Image>` 实例会被复用显示不同的图。若不告诉 expo-image"换图了"，它会在新图加载完成前继续显示上一张图（串图）。`recyclingKey`（通常用 `post.postId`）变化时清空旧图、当成全新图加载。现在既没用 FlashList、也没传 `recyclingKey`，暂时不会串图，但切到 FlashList 后必须加。

## Q6. 概念问答（cursor 分页 / 内存风险 / 真实宽高 / FlashList / reconciler / 视图复用）

**提问：**
（1）cursor-base 分页与传统的分页机制有什么区别？
（2）如果用户经常下滑到底部加载更多，那么久而久之，内存中是否会出现大量的 item，这样做是否会有渲染上的风险？
（3）对于 feedPost 的高度，什么时候会拿到真实宽高？是通过什么函数拿到的吗？比如 observeClientSize 这样的？
（4）为什么 Shopify 的 FlashList 的性能比 rn 内置的 FlatList / SectionList 性能更好，它做了哪些优化？
（5）"React 的 key：给 reconciler 用"这句话中的 reconciler 是什么？
（6）对于 recyclingKey 的描述，同一个 `<Image>` 组件会被重复使用，这样可以减少渲染次数提高性能吗？比如假设虚拟列表中一共会可视化 10 个节点，当滚动到第 11 个节点时，第一个节点会被拿去充当第 11 个节点？

**回答：**

**(1) 传统分页（offset/page）vs cursor-based：**
- 传统：`?page=3&size=20`，后端 `OFFSET 40 LIMIT 20`。优点能跳页、算总页数、简单；缺点数据漂移（翻页中插入/删除导致重复或漏）、深分页慢（扫描丢弃前 N 行）。
- cursor：请求带游标（时间戳/最后 id/排除 id），后端 `WHERE id < cursor LIMIT 20`。优点无漂移、深分页快（走索引）；缺点不能随机跳页、算不出精确总数。
- 本项目是 cursor-based 的 `exclude_ids` 变体（推荐流典型做法）：用 `exclude_ids` + `request_id` + `request_index`。

**(2) 有风险，这是当前架构的真实隐患。** 渲染层是 `ScrollView` + `.map()` 无虚拟化：
1. 视图节点无限增长，前 N 页所有 `FeedPost` 视图常驻内存不回收。
2. 图片内存是大头（一张 1080×1080 解码约 4MB+），累积易触发 OOM。
3. 每次 `setItems` 的 reconcile 成本随数组增长上升，滚动掉帧。
4. `appendUniqueItems` 每次 `new Set(existing.map(...))` 遍历全量去重，越来越贵。
解法：换 `FlashList` 虚拟化，内存与列表长度解耦。

**(3) 不是 `observeClientSize`/`onLayout` 那类测容器布局的方式，而是通过 expo-image 的 `onLoad` 回调拿图片解码后的原始像素宽高：**

```tsx
const [imageHeight, setImageHeight] = useState(POST_IMAGE_MAX_HEIGHT) // 292

function handleImageLoad(event: ImageLoadEventData) {
  const { width, height } = event.source // 图片原始像素宽高
  if (!width || !height || windowWidth <= 0) return
  const naturalHeight = (windowWidth * height) / width
  setImageHeight(Math.min(naturalHeight, POST_IMAGE_MAX_HEIGHT))
}
```

时机：图片下载并解码完成那一刻 → `onLoad` 触发 → 用真实宽高按"宽度铺满"换算高度 → 封顶 292 → `setImageHeight` 重渲染。区分：`onLoad.source.width/height` 是图片资源像素尺寸，`onLayout` 是视图在屏幕上的布局尺寸。副作用：初始 292、加载后才改真实高度，会有一次高度跳变。

**(4) FlashList 比 FlatList 快的原因：**
- FlatList（基于 VirtualizedList）：屏幕外 item 被卸载，重新进入时重建 → 频繁 mount/unmount + JS 线程负担 → 快速滚动白屏、掉帧。
- FlashList（基于 RecyclerListView 思路）优化：① **视图回收复用**（不卸载，把已有视图搬过去复用、只更新数据，类似原生 UITableView/RecyclerView）；② 几乎不白屏；③ 内存占用小；④ `estimatedItemSize` 让预算更准、减少抖动；⑤ 更少 bridge 通信。

**(5) reconciler（协调器）** 是 React 的核心算法，负责 diff 与更新：状态变化 → 生成新虚拟 DOM 树 → reconciler 比较新旧树算出最小变更集 → 只把变更应用到宿主（Web 真实 DOM，RN 原生视图），这个过程叫 reconciliation。现代实现叫 Fiber（React 16+），支持可中断、优先级调度、并发渲染。`key` 在这里用于在 diff 同一层列表时识别"新节点对应旧的哪个"，判断复用/新增/删除/重排。ReactDOM 与 React Native 是不同渲染器，但共用同一套 reconciler。

**(6) 你的理解基本正确：**
- "减少渲染次数提高性能吗"——是。它减少的是**视图实例的创建/销毁**（mount/unmount 开销），不是"渲染"本身（复用时仍会用新数据重渲染组件，只是底层视图实例被留用）。
- "10 个可视节点，滚到第 11 个时第 1 个被拿去当第 11 个"——方向完全对，这就是回收复用。更准确：框架维护一个**视图池**，滚出可视区的视图回收进池，新位置需要时从池取一个绑新数据，是动态池化复用，不是固定一一对应。
- 这里 `recyclingKey` 的作用：当第 1 个 Image 视图被复用去显示第 11 个的图时，若不标记"换图了"，会在新图加载完成前显示第 1 张残影（串图）。`recyclingKey` 变化时清空当前内容、当成全新图加载。

## Q7. 游标分页的存储顺序 / requestId 与 requestIndex 区别

**提问：**
（1）所以游标分页中，新的数据的 id 靠后，但是后端在存储时是按照倒序方式存储吗？我之前的理解是：后端存数据时，前面的都是 id 比较小的，当有新数据后，插入到最大 id 的后面。如果我的理解有误，请指正。
（2）FeedRankingSession 中的 requestId 和 requestIndex 有什么区别？

**回答：**

**(1) 需要纠正一个关键点：存储顺序 ≠ 展示顺序。后端不是"按倒序存储"，而是"按 id 递增存储，但查询时按倒序返回"。**
- **存储层面**：你的理解对，新数据 id 越来越大，新插入记录 id 在最大值后面递增，主键索引按 id 从小到大。
- **展示层面**：信息流要"最新在最上面"，所以查询时按 id 倒序排（`ORDER BY id DESC`）。倒序是查询排序规则，不是存储方式。

重看场景（已读到 `id=12`，之后插入 `id=20`）：
- "加载更多" = 取比 12 更旧的：`WHERE id < 12 ORDER BY id DESC LIMIT 20`，拿到 11、10、9...
- 新数据 `id=20` 比 12 大（更新），在列表更上方，不在 `id < 12` 范围里 → 下滑加载更多取不到它，这是对的。
- `id=20` 要等下拉刷新（游标重置）时才出现在顶部。

纠正你的原话：「新数据插到最大 id 后面」对存储是对的；但翻页取不到的真正原因不是它"存在后面"，而是**展示按 id 倒序、游标向更小 id 走，而新数据 id 更大、在游标的反方向**。

> 补充：本项目没用单一 id 游标，而是 `exclude_ids`。推荐流排序是模型算的、非严格时间序，`exclude_ids` 的好处正是不依赖任何单调排序，只要把"已看过的"排除掉就不会重复。

**(2) requestId vs requestIndex：层级不同。**

| | requestId | requestIndex |
|---|---|---|
| 含义 | 整次浏览会话的唯一标识 | 会话内第几批请求 |
| 类型 | 随机字符串(UUID) | 递增整数 |
| refresh 时 | 换新值 | 重置为 1 |
| load more 时 | 不变 | +1 |
| 类比 | 订单号 | 订单里第几件商品 |

- `requestId`：随机唯一字符串（`crypto.randomUUID()` 降级用 `feed-${Date.now()}-${random}`），代表"用户这一轮从头刷 feed 的整个会话"，只在 initial/refresh 换新、load_more 不变。作用：让后端关联同一会话的多次翻页，保持推荐排序/打散策略一致。
- `requestIndex`：递增整数，initial/refresh 重置为 1、load_more +1。作用：告诉后端"本次会话第几页/第几批"，用于分页定位、翻页策略、日志分析。

> 同一个 `requestId` + 递增 `requestIndex` = "同一次浏览会话里请求第 N 页"。

## Q8. Story Bar 两个数据的来源（是否前端 mock）

**提问：** 帮我判断一下现在推荐页顶部的 story bar 的两个数据是从哪里来的，story/headline 请求的响应中的数据明明是空的，是前端 mock 的吗？

**回答：** 确认了，**那两个数据是前端 mock 的，不是后端返回的。**

来源是 `src/features/story/__mock__/mock-music-stories.ts` 里的 `MOCK_MUSIC_STORY_HEADLINES`，由两个 mock 角色生成：**「🎵 BGM测试A」和「🎶 BGM测试B」**（头像用 Unsplash 图），带可播放的 mp3 BGM，专门用来测试 story 的 BGM 加载/暂停/预加载逻辑。

为什么后端返回空还显示？关键在开关 `ENABLE_MOCK_MUSIC_STORIES`（当前为 `true`）。在 `story-bar-section.tsx`：

```tsx
const sortedItems = useMemo(() => {
  const real = data?.items.length
    ? sortStoryHeadlineItems(data.items)
    : []
  // DEV：把带 BGM 的 mock 角色拼到头像栏最前面，方便直接点开测试
  return __DEV__ && ENABLE_MOCK_MUSIC_STORIES
    ? [...MOCK_MUSIC_STORY_HEADLINES, ...real]
    : real
}, [data?.items])
```

后端真实数据为空 → `real = []`，但因 `__DEV__ && ENABLE_MOCK_MUSIC_STORIES` 为真，把两个 mock headline 拼到最前面。而且这个开关还绕过了所有空数据/无好友/无 token 的隐藏判断（那些 early return 都加了 `!mockEnabled` 前缀），所以即使后端空、没好友、没登录，story bar 仍渲染这两个 mock 角色。

触发条件需同时满足：① `__DEV__` 为 true（开发构建）；② `ENABLE_MOCK_MUSIC_STORIES === true`。这是开发期专用测试数据，生产构建（`__DEV__` 为 false）不会出现。把 `ENABLE_MOCK_MUSIC_STORIES` 改成 `false` 即可回归真实数据（后端空就隐藏）。

---


---

# 下篇 · 知识点总结

## 目录

1. [Story Bar 未读高亮逻辑](#1-story-bar-未读高亮逻辑)
2. [FE 与 RN 实现对齐](#2-fe-与-rn-实现对齐)
3. [推荐页图片加载机制](#3-推荐页图片加载机制)
4. [分页机制：cursor-based vs 传统分页](#4-分页机制cursor-based-vs-传统分页)
5. [虚拟列表与列表性能](#5-虚拟列表与列表性能)
6. [图片组件与尺寸：expo-image / onLoad / onLayout](#6-图片组件与尺寸expo-image--onload--onlayout)
7. [React 基础概念：reconciler / key / recyclingKey](#7-react-基础概念reconciler--key--recyclingkey)
8. [Feed 会话状态：requestId / requestIndex / excludeIds](#8-feed-会话状态requestid--requestindex--excludeids)

---

## 1. Story Bar 未读高亮逻辑

推荐页顶部「限时动态」(Story Bar)中，头像的未读高亮描边由 `src/features/feed/story/headline-read.ts` 的 `isHeadlineCharacterUnread` 决定。

### 结论：以服务端 `unread` 字段为准（对齐后）

- 未读高亮与排序均以 `GET /story/headline` 响应中的 `unread` 字段为准。
- `unread = true` → 高亮（新帖、跨设备同步等场景由服务端保证正确）。
- 数据来源：`StoryHeadlineItem.unread`（布尔），IDL 定义在 `external/common-idl`，生成到 `src/generated/arca_apiComponents.ts`。

### 本地存储的角色

- 本地用 MMKV(`react-native-mmkv`，实例 `popop-default`)，key `story_read_state`，由 zustand store `src/features/story/story-store.ts` 管理。
- 记录：已读 story id、已读完的 character id、续看指针。
- 写入时机：用户在 `story-viewer.tsx` 看过 story 后。
- **作用范围**：仅服务于 story viewer 的「续看」体验，**不参与头像栏高亮判断**（对齐 FE 后）。

---

## 2. FE 与 RN 实现对齐

### 背景

排查发现 RN 与 FE(`popop-fe`)的 Story Bar 未读判定逻辑不一致：

| 维度 | FE（纯服务端驱动） | RN（对齐前，多了本地兜底） |
| --- | --- | --- |
| 函数签名 | `isHeadlineCharacterUnread(item)` | `isHeadlineCharacterUnread(item, read?)` |
| `unread=true` | 高亮 | 高亮（一致） |
| `unread=false` | 直接判已读 | 再查本地 MMKV，若仍有未看完 story 则继续高亮 |
| 本地存储参与高亮 | 否 | 是（续看兜底） |
| 排序 | 按 `item.unread` | 按 `isHeadlineCharacterUnread(item, read)` |

### 对齐操作（RN 回退为纯服务端驱动）

改动 4 个文件：

1. `headline-read.ts`：`isHeadlineCharacterUnread` 直接 `return item.unread`；`sortStoryHeadlineItems` 按 `item.unread` 排序；移除 `HeadlineReadSnapshot` 参数。
2. `components/story-avatar.tsx`：移除 `useStoryReadStore` 依赖，`showUnreadRing = isHeadlineCharacterUnread(item)`。
3. `components/story-bar-section.tsx`：移除 read snapshot，排序改为 `sortStoryHeadlineItems(data.items)`。
4. `index.ts`：移除 `HeadlineReadSnapshot` 类型导出。

> 保留未动：`story-store.ts` 的 `syncHeadlineReadStateFromServer` 与 MMKV 存储、`use-story-headline.ts` 拉取后的同步调用 —— 因为 FE 也保留，它们服务于 viewer 续看而非头像栏高亮。

### 双仓同步要点（来自 sync-from-fe / h5-to-rn-migration skill）

- 同步模式：文件级 copy + RN 改写（非 `@popop/*` workspace import）。
- 四分类：Logic（可直接同步）/ Adapter-bound（对照 `src/shared/storage`、`expo-*`）/ UI-only（RN 重写）/ 埋点（不迁移）。
- RN 改写：`localStorage` → MMKV/SecureStore；`useNavigate` → React Navigation；`className` → StyleSheet；`<img>` → `PopImage`/`PopIcon`。

---

## 3. 推荐页图片加载机制

### 现象

下拉刷新后，post 图片不立即显示，且没有占位（无模糊图、无骨架、无背景色），图片区域是空的直到加载完成。

### 原因分析

**(a) 图片组件**：feed 主图用的是 `expo-image` 的裸 `Image`（`src/pages/home/feed-post.tsx`），**没有走** 项目封装的 `PopImage`，也没有配置 `placeholder` / `transition` / `cachePolicy` / `recyclingKey`。

**(b) 无虚拟化**：推荐页用普通 `ScrollView` + `.map()` 渲染（`src/pages/home/home-page.tsx` → `tag-feed.tsx`），不是 `FlatList`/`FlashList`。所有 item 一次性挂载。

**(c) 无占位**：图片容器 `imageWrapper` 没有背景色，`transition` 默认 0，所以加载前是透明空盒子，加载完成后图片硬切出现（无淡入）。

### 刷新 vs 加载更多的占位差异

数据流是同一套（都走 `useFeed` 的 `applyBatch`），唯一区别是 `replace` 标志位：

- **刷新**：`applyBatch(..., replace=true, ...)` → 整个 `items` 数组被全新对象替换 → 旧 `FeedPost` 全部卸载、新的全部挂载（多在首屏内）→ 你盯着首屏看到「空框 → 突然出图」。
- **加载更多**：`applyBatch(..., replace=false, ...)` → 新 item 追加到数组尾部（`appendUniqueItems`）→ 新 item 挂载在屏幕外，先占住固定高度 292 的空盒子，滚到时往往已加载好。
- 此外，加载更多时底部有一个 `ActivityIndicator`（`loadingMoreContainer`），这就是你看到的「空白占位元素」。

> 本质：两种情况都没有真正的图片占位（placeholder/blurhash），只是「固定高度空盒子 + 底部 spinner」让加载更多看起来像有占位。

### 业界对比与改进方向

主流产品几乎都做占位/过渡，常见三类：

- **模糊占位 blurhash / thumbhash**（Instagram、Medium、Unsplash）：先显示低清模糊图，加载完渐变清晰。expo-image 支持 `placeholder={blurhash}`。
- **骨架屏 / 主色占位**（Twitter、小红书、Pinterest）：先灰块或主色调。
- **渐显过渡 fade**：200~300ms 淡入，避免硬切。

改进杠杆（按投入从小到大）：

1. 给 `imageWrapper` 加中性背景色 + `Image` 加 `transition={200}`。
2. feed 主图改走 `PopImage`，传 `recyclingKey={post.postId}`。
3. 后端返回 blurhash/主色 + 宽高比，做秒显占位；长期把 `ScrollView` 换 `FlashList`。

---

## 4. 分页机制：cursor-based vs 传统分页

### 传统分页（offset / page-number）

- 请求形如 `?page=3&size=20` 或 `?offset=40&limit=20`，后端 `OFFSET 40 LIMIT 20`。
- 优点：能跳页、能算总页数、实现简单。
- 缺点：
  - **数据漂移**：翻页中有插入/删除会导致重复或漏掉。
  - **深分页慢**：`OFFSET 100000` 要扫描并丢弃前 10 万行。

### cursor-based 分页（游标）

- 请求带游标（时间戳 / 最后一条 id / 排除 id 集合），后端 `WHERE id < cursor LIMIT 20`。
- 优点：无漂移（基于内容位置而非偏移）、深分页快（走索引）。
- 缺点：不能随机跳页、通常算不出精确总数。

### 关键概念：存储顺序 ≠ 展示顺序

- **存储**：id 升序递增（新数据 id 在最大值后面），主键索引按 id 从小到大。
- **展示**：信息流要最新在顶，所以查询时 `ORDER BY id DESC`（倒序是查询排序规则，不是存储方式）。

场景推演（已读到 `id=12`，之后插入 `id=20`）：

```
id=20  ← 新插入，最新，在最顶部（下拉刷新才会看到）
id=19
...
id=12  ← 游标位置（看到这了）
─────── 下面是「加载更多」取的范围（WHERE id < 12 ORDER BY id DESC）───────
id=11
id=10
...
```

- 游标向下走（id 变小），新数据 `id=20` 在游标向上的方向（id 变大），方向相反 → 加载更多取不到新数据，这是 cursor 分页的**正确行为**。
- 新数据要等**下拉刷新**（游标重置）才出现在顶部。
- 前后端配合：后端负责按游标条件正确返回；前端负责区分 load more / refresh 并维护游标状态。

### 业界处理「翻页时来了新内容」的策略

1. **下拉刷新才插入**（Twitter/微博/Instagram）：往下翻不打扰。
2. **「X 条新动态」浮条提示**（Twitter）：弹胶囊条，用户点了才刷新跳顶。
3. **exclude_ids 去重式**（本项目）：推荐流不按严格时间序，把「已展示 id」作为排除集，新内容天然可能在后续批次被推出，且永不重复。

### 本项目实现

属于 cursor-based 的 `exclude_ids` 变体（推荐流典型做法）：

- 不用单一 id 游标，而用 `exclude_ids`（已展示 id 集合）+ `request_id` + `request_index`。
- `request_index` 在 initial/refresh 重置为 1，load_more 时 +1。
- `hasMore` 由「本页返回 post 数是否 ≥ FEED_PAGE_SIZE」推断。
- **数据分页 ✅，视图虚拟化 ❌**：分页只控制何时拉下一批数据，不控制视图节点挂载数量。

---

## 5. 虚拟列表与列表性能

### 长列表无虚拟化的风险（本项目隐患）

推荐页用 `ScrollView` + `.map()`，没有虚拟化，长期下滑加载会有：

1. **视图节点无限增长**：前 N 页所有 `FeedPost` 视图常驻内存，不回收。
2. **图片内存是大头**：每张图解码后是未压缩位图（1080×1080 约 4MB+），累积易触发 OOM。
3. **reconcile 成本上升**：数组越长，diff 和布局越慢，滚动掉帧。
4. **去重变重**：`appendUniqueItems` 每次 `new Set(existing.map(...))` 遍历全量，越来越贵。

解法：换 `FlashList` 做虚拟化，内存与列表长度解耦。

### 虚拟列表是什么

只渲染可视窗口内的节点，窗口外用占位容器撑高度，滚动时动态增删/复用。

- **Web**：第三方库 —— `@tanstack/react-virtual`（原 react-virtual）、`react-window`、`react-virtualized`。不是 React 自带。
- **RN**：内置 `FlatList` / `SectionList`（基于 `VirtualizedList`）；社区高性能方案是 Shopify 的 `FlashList`。

### 为什么 FlashList 比 FlatList 更快

`FlatList`（基于 `VirtualizedList`）：屏幕外 item 会被卸载，重新进入视区时重建 → 频繁 mount/unmount + JS 线程负担 → 快速滚动出现白屏、掉帧。

`FlashList`（基于 RecyclerListView 思路）优化：

1. **视图回收复用**：不卸载屏幕外 item，而是把已有视图实例搬过去复用、只更新数据（类似原生 `UITableView` cell reuse / Android `RecyclerView`）。
2. **几乎不白屏**：视图复用而非重建，内容即时填充。
3. **内存占用小**：复用固定数量视图，内存与列表长度解耦。
4. **estimatedItemSize**：预估高度让它更准地预算可视区 item 数与滚动位置，减少布局抖动。
5. **更少 bridge 通信**：布局计算更高效，减少 JS 线程压力。

---

## 6. 图片组件与尺寸：expo-image / onLoad / onLayout

### expo-image

- Expo 生态的高性能图片组件库，用来**替代** RN 内置 `Image`。
- 提供：磁盘/内存缓存、`placeholder`/blurhash、`transition` 渐显、`contentFit`、`recyclingKey` 等。
- 本项目从 `'expo-image'` 导入 `Image` 与类型 `ImageLoadEventData`。

### 「拿到 imageUrl」≠「图片加载完成」

两个不同阶段，不要混淆：

- `post.imageUrl`：feed 接口返回数据里的一个 URL 字符串。拿到它只是「知道图片地址」，图片本身还没下载。
- `onLoad` 触发的「加载完成」：`<Image>` 拿 URL 去**下载字节并解码成位图**完成的那一刻，才是真正可显示。

时间线：`接口响应(拿到 imageUrl)` → `<Image source={{uri}}>` 联网下载 → `下载+解码完成` → 触发 `onLoad`。

### FeedPost 如何拿到图片真实宽高

不是用 `onLayout`/`ResizeObserver` 测容器布局，而是通过 expo-image 的 `onLoad` 回调拿**图片原始像素尺寸**：

```ts
// 初始用固定值兜底
const [imageHeight, setImageHeight] = useState(POST_IMAGE_MAX_HEIGHT) // 292

function handleImageLoad(event: ImageLoadEventData) {
  const { width, height } = event.source // 图片原始像素宽高
  if (!width || !height || windowWidth <= 0) return
  const naturalHeight = (windowWidth * height) / width // 宽度铺满后按比例算高度
  setImageHeight(Math.min(naturalHeight, POST_IMAGE_MAX_HEIGHT)) // 封顶 292
}
```

- 时机：图片下载+解码完成触发 `onLoad` → 算宽高比 → `setImageHeight` 重渲染。
- `ImageLoadEventData` 是 expo-image 导出的类型，`event.source.width/height` 是图片原始像素尺寸。
- **副作用**：初始固定 292、加载后才改真实高度，会有一次高度跳变（layout shift）。

### onLoad vs onLayout

| | onLoad（资源加载事件） | onLayout（布局事件） |
| --- | --- | --- |
| 触发时机 | 图片资源下载+解码完成 | 视图布局（位置/尺寸）被计算或改变（挂载、父容器变化、旋屏） |
| 回调数据 | 图片原始像素尺寸 `source.width/height` | 视图布局尺寸 `nativeEvent.layout = {x,y,width,height}` |
| 关注点 | 图片内容多大、加载好了没 | 这个视图框在屏幕上多大 |
| 适用组件 | Image | 所有 View 类组件 |

这里要算宽高比 → 用 `onLoad` 的像素尺寸，而非 `onLayout` 的布局尺寸。

### 消除高度跳变的方案

**后端直接返回图片宽高比（或 width/height）**：

- 手机/卡片宽度 `W` 固定 → 渲染那一刻就能算占位高度 `W × (height/width)`（再按规则封顶 292）。
- 首帧就用正确高度撑开，图片加载完高度不变，无 layout shift。
- 补充：RN `style` 支持 `aspectRatio` 属性，可不手算高度，直接给容器设 `aspectRatio: width/height` 让布局引擎算。
- 「先知道尺寸才能先占位」是 占位(尺寸) + placeholder(模糊图) + transition(渐显) 完整体验的基础。
- 前提：后端 IDL 返回里要有图片 width/height 字段。

---

## 7. React 基础概念：reconciler / key / recyclingKey

### reconciler（协调器）

- React 的核心算法/模块，负责 **diff 与更新**。
- 状态/props 变化触发重渲染 → 生成新的虚拟 DOM 树 → reconciler 比较新旧树，算出最小变更集 → 只把变更应用到宿主（Web 是真实 DOM，RN 是原生视图）。这个过程叫 reconciliation。
- 现代实现叫 **Fiber**（React 16+），把渲染拆成可中断的小单元，支持优先级调度、并发渲染。
- `ReactDOM` 与 `React Native` 是不同的**渲染器(renderer)**，但共用同一套 reconciler，只是把变更翻译成各自宿主的操作。

### React 的 key

- 给 reconciler 用，在 diff **同一层列表**时识别「新节点对应旧的哪个」。
- 有稳定 key → 能判断复用 / 新增 / 删除 / 重排；用数组下标当 key → 列表顺序变化时会误判，导致不必要重建甚至状态错乱。

### recyclingKey（expo-image 的 prop）

与 React `key` 是**不同层面**的东西：

| 概念 | 层面 | 作用 |
| --- | --- | --- |
| React `key` | reconciler | 判断节点复用/新增/删除/重排 |
| `recyclingKey` | expo-image 渲染 | 视图被回收复用时，标记「换图了」，清掉旧图避免串图 |

- 场景：虚拟列表回收复用视图时，同一个 `<Image>` 实例会被复用显示不同的图。
- 若不告诉 expo-image「数据源换了」，它会在新图加载完成前继续显示上一张图（串图/闪旧图）。
- `recyclingKey` 变化时，expo-image 立刻清空当前内容，当成全新图加载，消除串图。
- 通常用 `post.postId` 作为 `recyclingKey`。
- 现在没用 FlashList、也没传 recyclingKey，所以暂时没串图问题；一旦切 FlashList 必须加。

### 视图回收复用机制（你的理解确认）

- 「10 个可视节点，滚到第 11 个时，第 1 个被拿去当第 11 个」—— **方向正确**，这就是回收复用。
- 更准确：框架维护一个**视图池**，滚出可视区的视图回收进池，新位置需要时从池取一个绑新数据 —— 是动态池化复用，不是固定一一对应。
- 它减少的是**视图实例的创建/销毁**（mount/unmount 开销），不是「渲染」本身 —— 复用时仍会用新数据重渲染该组件，只是底层视图实例被留用。

---

## 8. Feed 会话状态：requestId / requestIndex / excludeIds

定义在 `src/features/feed/lib/feed-ranking-session.ts` 的 `FeedRankingSession`（模块级单例，存在内存中）。

### requestId（会话 id）

- 随机唯一字符串（`crypto.randomUUID()`，降级用 `feed-${Date.now()}-${random}`）。
- 代表「用户这一轮从头开始刷 feed 的整个会话」。
- 只在 initial/refresh 重置会话时换新；load_more 期间不变。
- 作用：让后端关联同一会话内的多次翻页，保持推荐排序模型/打散策略一致，便于埋点。

### requestIndex（批次序号）

- 递增整数：initial/refresh 重置为 1，每次 load_more +1。
- 作用：告诉后端「这是本次会话的第几页/第几批」，用于分页定位、翻页策略、日志分析。

### 对比

| | requestId | requestIndex |
| --- | --- | --- |
| 含义 | 整次浏览会话的唯一标识 | 会话内第几批请求 |
| 类型 | 随机字符串(UUID) | 递增整数 |
| refresh 时 | 换新值 | 重置为 1 |
| load more 时 | 不变 | +1 |
| 类比 | 订单号 | 订单里第几件商品 |

> 同一个 `requestId` + 递增 `requestIndex` = 「同一次浏览会话里请求第 N 页」。

### excludeIds（已展示 id 集合）

- 前端在 session 里累积「已展示过的 id」，下次请求作为 `exclude_ids` 传参，实现翻页不重复。
- 拿到数据后用 `Set` 去重累加：`session.excludeIds = [...new Set([...session.excludeIds, ...excludeIds])]`。
- 存内存（非持久化）；refresh 重置会话时清空，新旧内容重新参与推荐。
- 缺点：会话越长数组越大、请求体越大，可能需要后端做时间窗或上限截断。

---

## 待办 / 改进建议汇总

- [ ] feed 主图改走 `PopImage` 并加 `recyclingKey={post.postId}`（对齐项目 `rn-asset-conventions` 约定）。
- [ ] 给图片加占位色 + `transition`（~200ms）消除白屏硬切。
- [ ] 后端返回图片宽高比/尺寸，首帧用正确高度消除 layout shift（可配合 `aspectRatio`）。
- [ ] 长期：推荐页 `ScrollView` → `FlashList` 做虚拟化，解决长列表内存/性能风险。
- [ ] 关注后端对超长 `exclude_ids` 的处理（截断/时间窗）。








