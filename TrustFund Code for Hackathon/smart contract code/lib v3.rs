#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Balance,
    Deposits,
    TimeLock,
    BoolFlag,
}

#[derive(Clone)]
#[contracttype]
pub struct Deposit {
    pub depositor: Address,
    pub amount: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct TimeLock {
    pub deadline: u64,
    pub bool_flag: bool,
}

#[contract]
pub struct TrustFundContract;

#[contractimpl]
impl TrustFundContract {
    // Deposit tokens by anyone
    pub fn deposit(env: Env, from: Address, token: Address, amount: i128) {
        from.require_auth(); // Ensure the depositor authorized the transaction

        // Transfer tokens from depositor to contract
        token::Client::new(&env, &token).transfer(&from, &env.current_contract_address(), &amount);

        // Retrieve current deposits
        let mut deposits: Vec<Deposit> = env
            .storage()
            .instance()
            .get(&DataKey::Deposits)
            .unwrap_or(Vec::new(&env));

        // Add new deposit to the vector
        deposits.push_back(Deposit { depositor: from, amount });

        // Store updated deposits
        env.storage().instance().set(&DataKey::Deposits, &deposits);
    }

    // Set the time lock and bool flag for the contract
    pub fn set_time_lock(env: Env, deadline: u64, bool_flag: bool) {
        let timelock = TimeLock {
            deadline,
            bool_flag,
        };
        env.storage().instance().set(&DataKey::TimeLock, &timelock);
    }

    // Claim tokens after the deadline
    pub fn claim(env: Env, claimant: Address) {
        claimant.require_auth(); // Ensure claimant authorized this call

        let timelock: TimeLock = env
            .storage()
            .instance()
            .get(&DataKey::TimeLock)
            .expect("TimeLock not set");

        let current_time = env.ledger().timestamp();

        if current_time < timelock.deadline {
            panic!("Cannot claim before the deadline");
        }

        // Retrieve deposits
        let deposits: Vec<Deposit> = env
            .storage()
            .instance()
            .get(&DataKey::Deposits)
            .expect("No deposits found");

        // If bool_flag is true, transfer tokens to the claimant
        if timelock.bool_flag {
            let total_amount: i128 = deposits.iter().map(|deposit| deposit.amount).sum();

            let claimable_balance = ClaimableBalance {
                token: env.current_contract_address(),
                amount: total_amount,
            };

            // Transfer the total amount to the claimant
            token::Client::new(&env, &claimable_balance.token).transfer(
                &env.current_contract_address(),
                &claimant,
                &claimable_balance.amount,
            );

        } else {
            // If bool_flag is false, return tokens to depositors
            for deposit in deposits.iter() {
                token::Client::new(&env, &env.current_contract_address())
                    .transfer(&env.current_contract_address(), &deposit.depositor, &deposit.amount);
            }
        }

        // Clear the deposits after claiming or returning
        env.storage().instance().remove(&DataKey::Deposits);
    }
}

#[derive(Clone)]
#[contracttype]
pub struct ClaimableBalance {
    pub token: Address,
    pub amount: i128,
}
