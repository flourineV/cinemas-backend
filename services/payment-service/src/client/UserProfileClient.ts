import axios from 'axios';
import type { AxiosInstance } from 'axios';
import CircuitBreaker from 'opossum';

export class UserProfileClient {
  private readonly axiosInstance: AxiosInstance;
  private readonly internalSecret: string;
  private readonly circuitBreaker: CircuitBreaker;

  constructor() {
    const userProfileServiceUrl = process.env.USER_PROFILE_SERVICE_URL || 'http://user-profile-service:8082';
    this.internalSecret = process.env.INTERNAL_SECRET_KEY || '';

    // Configure axios instance
    this.axiosInstance = axios.create({
      baseURL: userProfileServiceUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Configure circuit breaker
    const circuitBreakerOptions = {
      timeout: 10000, // If request takes longer than 10s, trigger a failure
      errorThresholdPercentage: 50, // When 50% of requests fail, open the circuit
      resetTimeout: 30000, // After 30s, try again (half-open state)
      rollingCountTimeout: 10000, // Stats time window
      rollingCountBuckets: 10, // Number of buckets in the window
      name: 'userProfileService'
    };

    this.circuitBreaker = new CircuitBreaker(
      this.updateLoyaltyPointsInternal.bind(this),
      circuitBreakerOptions
    );

    // Circuit breaker event handlers
    this.circuitBreaker.on('open', () => {
      console.warn('[UserProfileClient] Circuit breaker opened - too many failures');
    });

    this.circuitBreaker.on('halfOpen', () => {
      console.log('[UserProfileClient] Circuit breaker half-open - testing service');
    });

    this.circuitBreaker.on('close', () => {
      console.log('[UserProfileClient] Circuit breaker closed - service recovered');
    });

    this.circuitBreaker.fallback(this.fallbackUpdateLoyalty.bind(this));
  }

  /**
   * Internal method that performs the actual API call
   */
  private async updateLoyaltyPointsInternal(userId: string, points: number): Promise<void> {
    try {
      await this.axiosInstance.patch(
        `/api/profiles/profiles/${userId}/loyalty`,
        points,
        {
          headers: {
            'X-Internal-Secret': this.internalSecret
          }
        }
      );

      console.log(`✅ [UserProfileClient] Loyalty points updated for userId: ${userId} | +${points} points`);
    } catch (error: any) {
      console.error(
        `❌ [UserProfileClient] Failed to update loyalty points for userId: ${userId} | Error: ${error.message}`
      );
      throw error; // Let circuit breaker handle retry/fallback
    }
  }

  /**
   * Update loyalty points with circuit breaker protection
   */
  async updateLoyaltyPoints(userId: string, points: number): Promise<void> {
    try {
      await this.circuitBreaker.fire(userId, points);
    } catch (error: any) {
      // Error already logged in fallback or internal method
      throw error;
    }
  }

  /**
   * Fallback method when circuit breaker is open or service fails
   */
  private fallbackUpdateLoyalty(userId: string, points: number, error: Error): void {
    console.warn(
      `⚠️ [UserProfileClient] Circuit Breaker activated for updateLoyaltyPoints. UserId: ${userId} | Points: ${points} | Error: ${error.message}`
    );
    
    // More
    // - Queue the request for retry later
    // - Store in a retry table
    // - Send to a dead letter queue
    // - Emit a metric/alert
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats() {
    return {
      state: this.circuitBreaker.opened ? 'OPEN' : this.circuitBreaker.halfOpen ? 'HALF_OPEN' : 'CLOSED',
      stats: this.circuitBreaker.stats
    };
  }

  /**
   * Manually open the circuit breaker
   */
  openCircuitBreaker(): void {
    this.circuitBreaker.open();
  }

  /**
   * Manually close the circuit breaker
   */
  closeCircuitBreaker(): void {
    this.circuitBreaker.close();
  }

  /**
   * Shutdown the circuit breaker
   */
  shutdown(): void {
    this.circuitBreaker.shutdown();
  }
}

export default UserProfileClient;