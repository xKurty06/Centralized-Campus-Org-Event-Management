<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EventCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $cats = ['Workshop','Seminar','Competition','Activity','Training','Outreach','Cultural','Other'];
        foreach ($cats as $name) {
            DB::table('event_categories')->updateOrInsert(['name' => $name], ['name' => $name, 'created_at' => now(), 'updated_at' => now()]);
        }
    }
}
