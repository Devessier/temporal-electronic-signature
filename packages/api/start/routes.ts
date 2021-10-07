/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
|
| This file is dedicated for defining HTTP routes. A single file is enough
| for majority of projects, however you can define routes in different
| files and just make sure to import them inside this file. For example
|
| Define routes in following two files
| ├── start/routes/cart.ts
| ├── start/routes/customer.ts
|
| and then import them inside `start/routes.ts` as follows
|
| import './routes/cart'
| import './routes/customer'
|
*/

import Route from '@ioc:Adonis/Core/Route'

Route.post('/procedure/create', 'ElectronicSignaturesController.create')

Route.get('/procedure/:uuid', 'ElectronicSignaturesController.status')

Route.post('/procedure/cancel/:uuid', 'ElectronicSignaturesController.cancelProcedure')

Route.post('/procedure/agree/:uuid', 'ElectronicSignaturesController.agreeDocument')

Route.post('/procedure/set-email-for-code/:uuid', 'ElectronicSignaturesController.setEmailForCode')
