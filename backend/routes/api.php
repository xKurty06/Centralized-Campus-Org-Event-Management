<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AcademicCatalogController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\ManageController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\NotificationController;

// Support both /api and /api/v1 so existing frontend docs and clients keep working.
foreach (['', 'v1'] as $versionPrefix) {
    Route::prefix($versionPrefix)->middleware([\App\Http\Middleware\Cors::class])->group(function () {
    // Public
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    Route::get('/departments', [AcademicCatalogController::class, 'departments']);
    Route::get('/courses', [AcademicCatalogController::class, 'courses']);
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{id}', [EventController::class, 'show']);
    Route::get('/organizations', [EventController::class, 'organizations']);
    Route::get('/organizations/{id}', [EventController::class, 'organization']);

    // Protected
    Route::middleware(['auth:sanctum', \App\Http\Middleware\CheckActiveUser::class])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::patch('/auth/change-password', [AuthController::class, 'changePassword']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::patch('/profile', [ProfileController::class, 'update']);

        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

        Route::get('/my-events', [EventController::class, 'myEvents']);
        Route::post('/events/{id}/register', [EventController::class, 'register']);
        Route::post('/events/{id}/payment-upload', [EventController::class, 'paymentUpload']);

        // Manage routes (Officer) — CheckOfficer should validate org ownership where applicable
        Route::prefix('manage')->middleware(\App\Http\Middleware\CheckOfficer::class)->group(function () {
            Route::get('/organizations', [ManageController::class, 'organizations']);
            Route::get('/dashboard', [ManageController::class, 'dashboard']);
            Route::get('/org-profile', [ManageController::class, 'orgProfile']);
            Route::put('/org-profile', [ManageController::class, 'updateOrgProfile']);
            Route::get('/members', [ManageController::class, 'members']);
            Route::get('/members/lookup', [ManageController::class, 'lookupMember']);
            Route::post('/members', [ManageController::class, 'addMember']);
            Route::patch('/members/{id}', [ManageController::class, 'updateMember']);
            Route::post('/events', [ManageController::class, 'createEvent']);
            Route::get('/events/{id}', [ManageController::class, 'event']);
            Route::put('/events/{id}', [ManageController::class, 'updateEvent']);
            Route::delete('/events/{id}', [ManageController::class, 'deleteEvent']);
            Route::get('/participants/{event_id}', [ManageController::class, 'participants']);
            Route::put('/participants/{reg_id}/approve-proof', [ManageController::class, 'approveProof']);
            Route::put('/participants/{reg_id}/reject-proof', [ManageController::class, 'rejectProof']);
            Route::post('/verify/{event_id}/search', [ManageController::class, 'verifySearch']);
            Route::put('/verify/{event_id}/confirm-payment/{reg_id}', [ManageController::class, 'confirmPayment']);
            Route::put('/verify/{event_id}/checkin/{reg_id}', [ManageController::class, 'checkin']);
            Route::post('/verify/{event_id}/sync', [ManageController::class, 'sync']);
        });

        // Admin routes
        Route::prefix('admin')->middleware(\App\Http\Middleware\CheckOverseer::class)->group(function () {
            Route::get('/dashboard', [AdminController::class, 'dashboard']);
            Route::post('/organizations', [AdminController::class, 'createOrg']);
            Route::get('/organizations', [AdminController::class, 'organizations']);
            Route::get('/organizations/{id}', [AdminController::class, 'organization']);
            Route::put('/organizations/{id}/accreditation', [AdminController::class, 'toggleAccreditation']);
            Route::post('/organizations/{id}/officers', [AdminController::class, 'addOfficer']);
            Route::delete('/organizations/{orgId}/officers/{officerId}', [AdminController::class, 'removeOfficer']);
            Route::put('/organizations/{id}', [AdminController::class, 'updateOrg']);
            Route::get('/events', [AdminController::class, 'events']);
            Route::delete('/events/{id}', [AdminController::class, 'deleteEvent']);
            Route::get('/users', [AdminController::class, 'users']);
            Route::get('/users/lookup', [AdminController::class, 'lookupUserBySchoolId']);
            Route::put('/users/{id}/deactivate', [AdminController::class, 'deactivateUser']);
            Route::put('/users/{id}/reactivate', [AdminController::class, 'reactivateUser']);
            Route::put('/users/{id}/role', [AdminController::class, 'updateUserRole']);
            Route::get('/audit', [AdminController::class, 'audit']);
        });
    });
    });
}
