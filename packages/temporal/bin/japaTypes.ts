import { Expect } from '@japa/expect';
import '@japa/runner';

declare module '@japa/runner' {
    interface TestContext {
        expect: Expect;
    }

    // interface Test<TestData> {
    //     // notify TypeScript about custom test properties
    // }
}
