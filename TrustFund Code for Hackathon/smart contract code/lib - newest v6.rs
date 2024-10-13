#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Balance,
    Deposits,
    TimeLock,
    Authenticators,
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
    pub flag1: bool,
    pub flag2: bool,
    pub flag3: bool,
    pub flag4: bool,
    pub flag5: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct ClaimableBalance {
    pub token: Address,
    pub amount: i128,
}

#[derive(Clone)]
#[contracttype]
pub struct Authenticator {
    pub address: Address,
}

#[contract]
pub struct TrustFundContract;

#[contractimpl]
impl TrustFundContract {
    // Deposit tokens by anyone
    pub fn deposit(env: Env, from: Address, token: Address, amount: i128) {
        from.require_auth();

        token::Client::new(&env, &token).transfer(&from, &env.current_contract_address(), &amount);

        let mut deposits: Vec<Deposit> = env
            .storage()
            .instance()
            .get(&DataKey::Deposits)
            .unwrap_or_else(|| Vec::new(&env));

        deposits.push_back(Deposit { depositor: from, amount });

        env.storage().instance().set(&DataKey::Deposits, &deposits);
    }

    // Set the time lock for the contract
    pub fn set_time_lock(env: Env, deadline: u64) {
        let timelock = TimeLock {
            deadline,
            flag1: false,
            flag2: false,
            flag3: false,
            flag4: false,
            flag5: false,
        };
        env.storage().instance().set(&DataKey::TimeLock, &timelock);
    }

    // Set individual flags
    pub fn set_flag(env: Env, flag_number: u32, value: bool) {
        let mut timelock: TimeLock = env
            .storage()
            .instance()
            .get(&DataKey::TimeLock)
            .expect("TimeLock not set");

        match flag_number {
            1 => timelock.flag1 = value,
            2 => timelock.flag2 = value,
            3 => timelock.flag3 = value,
            4 => timelock.flag4 = value,
            5 => timelock.flag5 = value,
            _ => panic!("Invalid flag number"),
        }

        env.storage().instance().set(&DataKey::TimeLock, &timelock);
    }

    // Add an authenticator
    pub fn add_authenticator(env: Env, new_auth: Address) {
        let mut authenticators: Vec<Authenticator> = env
            .storage()
            .instance()
            .get(&DataKey::Authenticators)
            .unwrap_or_else(|| Vec::new(&env));

        authenticators.push_back(Authenticator { address: new_auth });

        env.storage().instance().set(&DataKey::Authenticators, &authenticators);
    }

    // Remove an authenticator
    pub fn remove_authenticator(env: Env, auth_to_remove: Address) {
        let authenticators: Vec<Authenticator> = env
            .storage()
            .instance()
            .get(&DataKey::Authenticators)
            .expect("No authenticators found");

        let mut new_authenticators = Vec::new(&env);
        for auth in authenticators.iter() {
            if auth.address != auth_to_remove {
                new_authenticators.push_back(auth.clone());
            }
        }

        env.storage().instance().set(&DataKey::Authenticators, &new_authenticators);
    }

    // Claim tokens after the deadline
    pub fn claim(env: Env, claimant: Address) {
        claimant.require_auth();

        let timelock: TimeLock = env
            .storage()
            .instance()
            .get(&DataKey::TimeLock)
            .expect("TimeLock not set");

        let current_time = env.ledger().timestamp();

        if current_time < timelock.deadline {
            panic!("Cannot claim before the deadline");
        }

        let deposits: Vec<Deposit> = env
            .storage()
            .instance()
            .get(&DataKey::Deposits)
            .expect("No deposits found");

        // Check if all flags are true
        let all_flags_true = timelock.flag1 && timelock.flag2 && timelock.flag3 && timelock.flag4 && timelock.flag5;

        if all_flags_true {
            // Transfer tokens to the claimant
            let total_amount: i128 = deposits.iter().map(|deposit| deposit.amount).sum();

            let claimable_balance = ClaimableBalance {
                token: env.current_contract_address(),
                amount: total_amount,
            };

            token::Client::new(&env, &claimable_balance.token).transfer(
                &env.current_contract_address(),
                &claimant,
                &claimable_balance.amount,
            );
        } else {
            // Return tokens to depositors
            for deposit in deposits.iter() {
                token::Client::new(&env, &env.current_contract_address())
                    .transfer(&env.current_contract_address(), &deposit.depositor, &deposit.amount);
            }
        }

        // Clear the deposits after claiming or returning
        env.storage().instance().remove(&DataKey::Deposits);
    }
}