<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Database\Seeders\DepartmentsSeeder;
use Database\Seeders\VenuesSeeder;
use Database\Seeders\EventCategoriesSeeder;
use Database\Seeders\OrgCategoriesSeeder;
use Database\Seeders\CoursesSeeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            DepartmentsSeeder::class,
            VenuesSeeder::class,
            EventCategoriesSeeder::class,
            OrgCategoriesSeeder::class,
            CoursesSeeder::class,
        ]);
    }
}
