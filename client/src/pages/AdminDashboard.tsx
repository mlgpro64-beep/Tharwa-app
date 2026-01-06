import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useLocation } from "wouter";
import { 
  Users, UserCheck, UserX, Briefcase, CheckCircle, Clock, 
  AlertCircle, Shield, ChevronLeft, Eye, X, Check, Search,
  BarChart3, TrendingUp, Award
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

type AdminStats = {
  totalUsers: number;
  totalClients: number;
  totalTaskers: number;
  verifiedTaskers: number;
  pendingVerifications: number;
  totalTasks: number;
  openTasks: number;
  completedTasks: number;
  assignedTasks: number;
};

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isRTL = i18n.language === "ar";
  
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: pendingVerifications = [], isLoading: pendingLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/pending-verifications"],
  });

  const approveMutation = useMutation({
    mutationFn: (userId: string) => apiRequest("POST", `/api/admin/users/${userId}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: isRTL ? "تم اعتماد المنفذ بنجاح" : "Tasker approved successfully" });
      setSelectedUser(null);
      setShowCertificate(false);
    },
    onError: () => {
      toast({ title: isRTL ? "حدث خطأ" : "Error occurred", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) => 
      apiRequest("POST", `/api/admin/users/${userId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-verifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: isRTL ? "تم رفض الطلب" : "Request rejected" });
      setSelectedUser(null);
      setShowCertificate(false);
      setShowRejectDialog(false);
      setRejectReason("");
    },
    onError: () => {
      toast({ title: isRTL ? "حدث خطأ" : "Error occurred", variant: "destructive" });
    },
  });

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const StatCard = ({ icon: Icon, label, value, color, subValue }: { 
    icon: any; label: string; value: number; color: string; subValue?: string 
  }) => (
    <Card className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur-2xl border border-white/20">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-2xl ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subValue && <p className="text-xs text-muted-foreground">{subValue}</p>}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-black" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-2xl border-b border-white/20">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setLocation("/")}
              data-testid="button-back"
            >
              <ChevronLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              <h1 className="text-xl font-bold">{isRTL ? "لوحة الأدمن" : "Admin Panel"}</h1>
            </div>
          </div>
          {stats && stats.pendingVerifications > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {stats.pendingVerifications} {isRTL ? "بانتظار المراجعة" : "pending"}
            </Badge>
          )}
        </div>
      </div>

      <div className="p-4 pb-24 space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-white/60 dark:bg-white/5 backdrop-blur-xl">
            <TabsTrigger value="overview" className="flex-1" data-testid="tab-overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              {isRTL ? "نظرة عامة" : "Overview"}
            </TabsTrigger>
            <TabsTrigger value="verifications" className="flex-1" data-testid="tab-verifications">
              <Award className="w-4 h-4 mr-2" />
              {isRTL ? "التحقق" : "Verify"}
              {pendingVerifications.length > 0 && (
                <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 justify-center">
                  {pendingVerifications.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1" data-testid="tab-users">
              <Users className="w-4 h-4 mr-2" />
              {isRTL ? "المستخدمين" : "Users"}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-6 space-y-4">
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="p-4 h-24 animate-pulse bg-white/40" />
                ))}
              </div>
            ) : stats && (
              <>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  {isRTL ? "إحصائيات المنصة" : "Platform Stats"}
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <StatCard 
                    icon={Users} 
                    label={isRTL ? "إجمالي المستخدمين" : "Total Users"} 
                    value={stats.totalUsers} 
                    color="bg-gradient-to-br from-blue-500 to-blue-600" 
                  />
                  <StatCard 
                    icon={UserCheck} 
                    label={isRTL ? "العملاء" : "Clients"} 
                    value={stats.totalClients} 
                    color="bg-gradient-to-br from-green-500 to-green-600" 
                  />
                  <StatCard 
                    icon={Briefcase} 
                    label={isRTL ? "المنفذين" : "Taskers"} 
                    value={stats.totalTaskers} 
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                    subValue={`${stats.verifiedTaskers} ${isRTL ? "معتمد" : "verified"}`}
                  />
                  <StatCard 
                    icon={AlertCircle} 
                    label={isRTL ? "بانتظار التحقق" : "Pending"} 
                    value={stats.pendingVerifications} 
                    color="bg-gradient-to-br from-orange-500 to-orange-600" 
                  />
                  <StatCard 
                    icon={Clock} 
                    label={isRTL ? "المهام المفتوحة" : "Open Tasks"} 
                    value={stats.openTasks} 
                    color="bg-gradient-to-br from-cyan-500 to-cyan-600" 
                  />
                  <StatCard 
                    icon={CheckCircle} 
                    label={isRTL ? "المهام المكتملة" : "Completed"} 
                    value={stats.completedTasks} 
                    color="bg-gradient-to-br from-emerald-500 to-emerald-600" 
                  />
                </div>
              </>
            )}
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="mt-6 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              {isRTL ? "طلبات التحقق المعلقة" : "Pending Verifications"}
            </h2>
            
            {pendingLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="p-4 h-32 animate-pulse bg-white/40" />
                ))}
              </div>
            ) : pendingVerifications.length === 0 ? (
              <Card className="p-8 text-center bg-white/60 dark:bg-white/5 backdrop-blur-xl">
                <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  {isRTL ? "لا توجد طلبات معلقة" : "No pending verifications"}
                </p>
              </Card>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {pendingVerifications.map((user, index) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl border border-orange-500/30">
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl">
                            {user.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold truncate">{user.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">@{user.username}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                            <Badge variant="outline" className="mt-2">
                              {user.taskerType === 'specialized' ? (isRTL ? 'متخصص' : 'Specialized') : (isRTL ? 'عام' : 'General')}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                          <Button 
                            className="flex-1" 
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowCertificate(true);
                            }}
                            data-testid={`button-view-certificate-${user.id}`}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            {isRTL ? "عرض الشهادة" : "View Certificate"}
                          </Button>
                          <Button 
                            className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
                            onClick={() => approveMutation.mutate(user.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${user.id}`}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            {isRTL ? "اعتماد" : "Approve"}
                          </Button>
                          <Button 
                            variant="destructive"
                            size="icon"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowRejectDialog(true);
                            }}
                            data-testid={`button-reject-${user.id}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-6 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input 
                placeholder={isRTL ? "بحث عن مستخدم..." : "Search users..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/60 dark:bg-white/5 backdrop-blur-xl"
                data-testid="input-search-users"
              />
            </div>

            {usersLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <Card key={i} className="p-4 h-20 animate-pulse bg-white/40" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Card 
                    key={user.id} 
                    className="p-4 bg-white/60 dark:bg-white/5 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold ${
                        user.role === 'tasker' 
                          ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        {user.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate">{user.name}</h3>
                          {user.isAdmin && (
                            <Badge variant="secondary" className="text-xs">Admin</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={user.role === 'tasker' ? 'default' : 'outline'}>
                          {user.role === 'tasker' ? (isRTL ? 'منفذ' : 'Tasker') : (isRTL ? 'عميل' : 'Client')}
                        </Badge>
                        {user.role === 'tasker' && (
                          <Badge 
                            variant="outline" 
                            className={
                              user.verificationStatus === 'approved' ? 'border-green-500 text-green-500' :
                              user.verificationStatus === 'pending' ? 'border-orange-500 text-orange-500' :
                              'border-red-500 text-red-500'
                            }
                          >
                            {user.verificationStatus === 'approved' ? (isRTL ? 'معتمد' : 'Verified') :
                             user.verificationStatus === 'pending' ? (isRTL ? 'معلق' : 'Pending') :
                             (isRTL ? 'مرفوض' : 'Rejected')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Certificate View Dialog */}
      <Dialog open={showCertificate} onOpenChange={setShowCertificate}>
        <DialogContent className="max-w-lg bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{isRTL ? "شهادة المنفذ" : "Tasker Certificate"}</DialogTitle>
            <DialogDescription>
              {selectedUser?.name} - @{selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser?.certificateUrl ? (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden border">
                <img 
                  src={selectedUser.certificateUrl} 
                  alt="Certificate" 
                  className="w-full h-auto"
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600"
                  onClick={() => approveMutation.mutate(selectedUser.id)}
                  disabled={approveMutation.isPending}
                  data-testid="button-approve-dialog"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {isRTL ? "اعتماد الشهادة" : "Approve Certificate"}
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setShowCertificate(false);
                    setShowRejectDialog(true);
                  }}
                  data-testid="button-reject-dialog"
                >
                  <X className="w-4 h-4 mr-2" />
                  {isRTL ? "رفض" : "Reject"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto text-orange-500 mb-4" />
              <p className="text-muted-foreground">
                {isRTL ? "لم يتم رفع شهادة" : "No certificate uploaded"}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle>{isRTL ? "رفض طلب التحقق" : "Reject Verification"}</DialogTitle>
            <DialogDescription>
              {isRTL ? "أدخل سبب الرفض (اختياري)" : "Enter rejection reason (optional)"}
            </DialogDescription>
          </DialogHeader>
          
          <Textarea 
            placeholder={isRTL ? "سبب الرفض..." : "Rejection reason..."}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
            data-testid="input-reject-reason"
          />
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => setShowRejectDialog(false)}
            >
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button 
              variant="destructive"
              className="flex-1"
              onClick={() => selectedUser && rejectMutation.mutate({ 
                userId: selectedUser.id, 
                reason: rejectReason 
              })}
              disabled={rejectMutation.isPending}
              data-testid="button-confirm-reject"
            >
              {isRTL ? "تأكيد الرفض" : "Confirm Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
