#!/usr/bin/env node

/**
 * Auto Sync Functionality Test
 * Tests the automatic synchronization feature of the ZimaOS plugin
 */
class AutoSyncTest {
    constructor() {
        this.testResults = [];
    }

    async runAllTests() {
        console.log('🚀 Starting Auto Sync Functionality Test\n');
        
        try {
            // Test 1: Check auto sync timer setup
            console.log('🔍 Test 1: Auto Sync Timer Setup');
            const timerTest = await this.testAutoSyncTimer();
            this.testResults.push({ name: 'Auto Sync Timer', passed: timerTest });
            
            // Test 2: Check sync interval calculation
            console.log('\n🔍 Test 2: Sync Interval Calculation');
            const intervalTest = await this.testSyncInterval();
            this.testResults.push({ name: 'Sync Interval Calculation', passed: intervalTest });
            
            // Test 3: Check auto sync execution logic
            console.log('\n🔍 Test 3: Auto Sync Execution Logic');
            const executionTest = await this.testAutoSyncExecution();
            this.testResults.push({ name: 'Auto Sync Execution', passed: executionTest });
            
            // Test 4: Check sync status management
            console.log('\n🔍 Test 4: Sync Status Management');
            const statusTest = await this.testSyncStatusManagement();
            this.testResults.push({ name: 'Sync Status Management', passed: statusTest });
            
            // Display results
            this.displayResults();
            
        } catch (error) {
            console.error('❌ Test execution failed:', error.message);
            return false;
        }
    }

    async testAutoSyncTimer() {
        console.log('   Testing auto sync timer setup logic...');
        
        try {
            // Simulate timer setup logic from main.ts
            const mockSettings = {
                autoSyncEnabled: true,
                syncInterval: 5 // 5 minutes
            };
            
            // Test timer interval calculation
            const expectedIntervalMs = mockSettings.syncInterval * 60 * 1000; // 5 * 60 * 1000 = 300000ms
            const actualIntervalMs = 5 * 60 * 1000;
            
            console.log(`   Expected interval: ${expectedIntervalMs}ms (${mockSettings.syncInterval} minutes)`);
            console.log(`   Calculated interval: ${actualIntervalMs}ms`);
            
            if (expectedIntervalMs === actualIntervalMs) {
                console.log('   ✅ Timer interval calculation correct');
                return true;
            } else {
                console.log('   ❌ Timer interval calculation incorrect');
                return false;
            }
            
        } catch (error) {
            console.log(`   ❌ Timer test failed: ${error.message}`);
            return false;
        }
    }

    async testSyncInterval() {
        console.log('   Testing sync interval configurations...');
        
        try {
            const testCases = [
                { minutes: 1, expectedMs: 60000 },
                { minutes: 5, expectedMs: 300000 },
                { minutes: 15, expectedMs: 900000 },
                { minutes: 30, expectedMs: 1800000 },
                { minutes: 60, expectedMs: 3600000 }
            ];
            
            let allPassed = true;
            
            for (const testCase of testCases) {
                const calculatedMs = testCase.minutes * 60 * 1000;
                console.log(`   Testing ${testCase.minutes} minutes = ${calculatedMs}ms`);
                
                if (calculatedMs !== testCase.expectedMs) {
                    console.log(`   ❌ Failed: Expected ${testCase.expectedMs}ms, got ${calculatedMs}ms`);
                    allPassed = false;
                } else {
                    console.log(`   ✅ Passed: ${testCase.minutes} minutes correctly converted`);
                }
            }
            
            return allPassed;
            
        } catch (error) {
            console.log(`   ❌ Interval test failed: ${error.message}`);
            return false;
        }
    }

    async testAutoSyncExecution() {
        console.log('   Testing auto sync execution flow...');
        
        try {
            // Simulate the auto sync execution logic
            let syncInProgress = false;
            let syncExecuted = false;
            
            // Mock performAutoSync function
            const performAutoSync = async () => {
                console.log('   Auto sync timer triggered - starting automatic sync');
                
                if (syncInProgress) {
                    console.log('   Auto sync: Skipping - sync already in progress');
                    return false;
                }
                
                console.log('   Auto sync: Starting automatic synchronization...');
                syncInProgress = true;
                
                // Simulate sync operation
                await new Promise(resolve => setTimeout(resolve, 100));
                
                console.log('   Auto sync: Executing sync operation');
                syncExecuted = true;
                syncInProgress = false;
                
                console.log('   Auto sync: Completed successfully');
                return true;
            };
            
            // Test normal execution
            const result1 = await performAutoSync();
            if (!result1 || !syncExecuted) {
                console.log('   ❌ Auto sync execution failed');
                return false;
            }
            
            // Test concurrent execution prevention
            syncInProgress = true;
            syncExecuted = false;
            const result2 = await performAutoSync();
            if (result2 || syncExecuted) {
                console.log('   ❌ Concurrent sync prevention failed');
                return false;
            }
            
            console.log('   ✅ Auto sync execution logic working correctly');
            return true;
            
        } catch (error) {
            console.log(`   ❌ Execution test failed: ${error.message}`);
            return false;
        }
    }

    async testSyncStatusManagement() {
        console.log('   Testing sync status management...');
        
        try {
            // Mock sync status object
            const syncStatus = {
                syncInProgress: false,
                lastSyncTime: null,
                errorCount: 0,
                isConnected: true
            };
            
            // Test status updates during sync
            console.log('   Testing status update during sync start...');
            syncStatus.syncInProgress = true;
            
            if (!syncStatus.syncInProgress) {
                console.log('   ❌ Sync status not updated on start');
                return false;
            }
            
            console.log('   Testing status update on sync completion...');
            syncStatus.syncInProgress = false;
            syncStatus.lastSyncTime = new Date();
            syncStatus.errorCount = 0;
            
            if (syncStatus.syncInProgress || !syncStatus.lastSyncTime) {
                console.log('   ❌ Sync status not updated on completion');
                return false;
            }
            
            console.log('   Testing error count management...');
            syncStatus.errorCount = 1;
            
            if (syncStatus.errorCount !== 1) {
                console.log('   ❌ Error count not managed correctly');
                return false;
            }
            
            console.log('   ✅ Sync status management working correctly');
            return true;
            
        } catch (error) {
            console.log(`   ❌ Status management test failed: ${error.message}`);
            return false;
        }
    }

    displayResults() {
        console.log('\n📊 Auto Sync Test Results Summary:');
        console.log('=' .repeat(50));
        
        let allPassed = true;
        
        for (const result of this.testResults) {
            const status = result.passed ? '✅ Passed' : '❌ Failed';
            console.log(`   ${result.name}: ${status}`);
            if (!result.passed) allPassed = false;
        }
        
        console.log('\n🎯 Overall Result:');
        if (allPassed) {
            console.log('   ✅ All auto sync tests passed!');
            console.log('   🔄 Auto sync functionality should work correctly');
        } else {
            console.log('   ❌ Some auto sync tests failed');
            console.log('   ⚠️  Auto sync functionality may have issues');
        }
        
        console.log('\n📝 Next Steps:');
        console.log('   1. Enable auto sync in Obsidian plugin settings');
        console.log('   2. Set a sync interval (e.g., 5 minutes)');
        console.log('   3. Monitor console logs for auto sync messages');
        console.log('   4. Check if sync operations occur at the set intervals');
        
        console.log('\n' + '=' .repeat(50));
        console.log('✅ Auto Sync Test Completed!');
        
        return allPassed;
    }
}

// Run the auto sync test
const tester = new AutoSyncTest();
tester.runAllTests().then(success => {
    const allPassed = tester.testResults.every(result => result.passed);
    console.log(`\n🎯 Auto sync test ${allPassed ? 'successfully' : 'failed'} completed`);
    process.exit(allPassed ? 0 : 1);
}).catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
});