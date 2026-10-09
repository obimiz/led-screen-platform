import {apiSuccess} from "@/lib/api/responses"; import {salesApi} from "@/lib/sales/api"; import {getAdminNotifications,getUnreadNotificationCount} from "@/services/notifications";
export async function GET(){return salesApi(async admin=>apiSuccess("Notifications loaded",{items:await getAdminNotifications(admin.id),unreadCount:await getUnreadNotificationCount(admin.id)}));}
