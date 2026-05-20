import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageSquare, 
  Brain, 
  Clock, 
  Target, 
  CheckSquare, 
  ListTodo,
  Zap
} from "lucide-react";
import Link from "next/link";
import { Sig360LogoMark } from "@/components/branding/Sig360LogoMark";

const stats = [
  { name: "Active Sessions", value: "1", icon: MessageSquare, href: "/chat" },
  { name: "Memory Files", value: "12", icon: Brain, href: "/memory" },
  { name: "Scheduled Jobs", value: "3", icon: Clock, href: "/cron" },
  { name: "Active Goals", value: "5", icon: Target, href: "/goals" },
  { name: "Pending Todos", value: "8", icon: CheckSquare, href: "/todos" },
  { name: "Mission Queue", value: "2", icon: ListTodo, href: "/missions" },
];

export default function Dashboard() {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Sig360LogoMark boxClassName="h-12 w-12 rounded-lg" letterClassName="text-2xl font-bold leading-none text-brand" />
          <h1 className="text-3xl font-bold text-foreground">SIG360</h1>
        </div>
        <p className="text-muted-foreground">Your digital right-hand at a glance</p>
      </div>

      {/* Status Banner */}
      <Card className="mb-8 bg-gradient-to-r from-brand/20 to-card border-brand/30">
        <CardContent className="flex items-center justify-between py-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20">
              <Zap className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">System Status</h2>
              <p className="text-muted-foreground">All systems operational</p>
            </div>
          </div>
          <Badge variant="outline" className="border-green-500 text-green-500">
            Online
          </Badge>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <Card className="bg-card border-border hover:border-brand/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.name}
                </CardTitle>
                <stat.icon className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/chat">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
              <MessageSquare className="w-8 h-8 text-brand" />
              <span className="text-sm text-foreground">New Chat</span>
            </div>
          </Link>
          <Link href="/todos">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
              <CheckSquare className="w-8 h-8 text-brand" />
              <span className="text-sm text-foreground">Add Todo</span>
            </div>
          </Link>
          <Link href="/cron">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
              <Clock className="w-8 h-8 text-brand" />
              <span className="text-sm text-foreground">Schedule Task</span>
            </div>
          </Link>
          <Link href="/memory">
            <div className="flex flex-col items-center gap-2 p-4 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer">
              <Brain className="w-8 h-8 text-brand" />
              <span className="text-sm text-foreground">View Memory</span>
            </div>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
