// Display taxonomy only. Never rewrites the source daily records.
const aliases={
 '二进制思维':'二进制','异或':'XOR','马拉车':'Manacher','字典树':'Trie',
 '二分查找':'二分','等价转化':'等价转换','转换':'等价转换','转化':'等价转换','巧妙转换':'等价转换',
 '公式变形':'式子变形','DP 优化':'DP 优化','优化 DP':'DP 优化',
 '打印具体方案':'方案还原','输出具体方案':'方案还原','具体方案':'方案还原','输出方案':'方案还原',
 'HH 项链 trick':'HH 的项链','中心扩展':'中心扩展法','寻找子问题':'状态设计',
 '最大子段和':'最大子数组和','差分数组':'差分','换根':'换根 DP','质因子':'质因子分解',
 '调和级数枚举':'调和级数','从特殊情况入手':'从特殊到一般','多背包':'多重背包',
 '最短路':'单源最短路','子序列匹配':'字符串子序列','字符串匹配':'字符串匹配'
};
const excluded=new Set(['恰好','有简单做法','优化','增量','相邻不同','常数项','区间','证明','手玩','状态转移','自顶向下','递归思维']);
export function normalizeTag(tag){const t=tag.trim().replace(/\s+/g,' ');return excluded.has(t)?null:(aliases[t]||t);}
export const topicCategories=['动态规划','数据结构','图论与树','数学与数论','位运算','字符串','贪心与构造','搜索与枚举','二分与分治','前缀和与差分','双指针与滑动窗口','排序','解题方法与实现技巧','其他算法'];
export function categoryOf(tag){
 if(/DP|背包|记忆化|状态设计|刷表|滚动数组|打家劫舍|爬楼梯|方案还原|LIS|最大子数组和/.test(tag))return '动态规划';
 if(/树状数组|线段树|并查集|单调栈|单调队列|堆|队列|链表|有序集合|ST 表|数据结构|HH 的项链|Segment Tree|离散化/.test(tag))return '数据结构';
 if(/Trie|KMP|LCP|LCS|Z 函数|Manacher|字符串|回文|子序列自动机|中心扩展/.test(tag))return '字符串';
 if(/图|树|LCA|直径|重心|拓扑|最短路|Dijkstra|Floyd|生成树|割点|找环|最大独立集|倍增|启发式合并|次短路|奇偶染色|棋盘染色/.test(tag))return '图论与树';
 if(/位运算|二进制|拆位|AND|OR|XOR|线性基|状压|逐位|logTrick/.test(tag))return '位运算';
 if(/前缀|差分|交替和|Abel|整体求和/.test(tag))return '前缀和与差分';
 if(/双指针|滑动窗口|三指针/.test(tag))return '双指针与滑动窗口';
 if(/二分|分治|分块|根号分解|CDQ|折半|二维数点|最小化最大值|最大化最小值/.test(tag))return '二分与分治';
 if(/排序|逆序对/.test(tag))return '排序';
 if(/贪心|构造|交换论证/.test(tag))return '贪心与构造';
 if(/枚举|搜索|回溯|DFS|BFS|暴力/.test(tag))return '搜索与枚举';
 if(/数学|数论|GCD|LCM|同余|因子|质因|欧拉|裴蜀|矩阵|组合|计数|容斥|期望|概率|博弈|乘法原理|斐波那契|调和|鸽巢|周期|中位数|绝对值|距离|凸包|不等式|排列|集合划分|Berlekamp|Kitamasa|LPF|core|辗转相除法|置换|方案数/.test(tag))return '数学与数论';
 if(/结论|脑筋急转弯|分类讨论|等价|变形|不变量|贡献法|分解|正难则反|逆向|横难则竖|从特殊|建模|打表|编程技巧|哨兵|模拟|预处理|时间戳|增量法|懒更新|合并区间|递归|迭代|试填|字典序|交互|哈希表|异或哈希|分组循环|离线|斜率优化|区间不同元素个数|子序列/.test(tag))return '解题方法与实现技巧';
 return '其他算法';
}
export function belongsToTopic(problem,topic){return !topic||(topic==='__untagged'?!problem.topics.length:topic.startsWith('__group:')?problem.topics.some(t=>categoryOf(t)===topic.slice(8)):problem.topics.includes(normalizeTag(topic)));}
