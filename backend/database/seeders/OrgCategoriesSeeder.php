<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrgCategoriesSeeder extends Seeder
{
    public function run(): void
    {
        $cats = ['Academic','Non-Academic','Religious'];
        foreach ($cats as $name) {
            DB::table('org_categories')->updateOrInsert(['name' => $name], ['name' => $name, 'created_at' => now(), 'updated_at' => now()]);
        }
    }
}
