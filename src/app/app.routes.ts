import { Routes } from '@angular/router';
import { ConfiguracioPage } from 'src/app/pages/configuracio/configuracio-page';
import { HomePage } from 'src/app/pages/home/home-page';

export const routes: Routes = [

    { path: "configuracio", component: ConfiguracioPage },
    { path: ":id", component: HomePage },
    { path: "", component: HomePage },

];
