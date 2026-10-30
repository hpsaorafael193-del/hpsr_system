import {redirect} from 'next/navigation';
import {legacyDashboardDestination} from '@/lib/legacy-dashboard-redirect';
export default function Page({searchParams}:{searchParams:Record<string,string|string[]|undefined>}){
 redirect(legacyDashboardDestination('/dashboard/acompanhamento',searchParams,{specialty:'pediatria'}));
}
