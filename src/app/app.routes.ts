import { Routes } from '@angular/router';
import { App } from 'src/app/app';

export const routes: Routes = [

    { path: ":id", component: App },
    { path: "", component: App },

];
