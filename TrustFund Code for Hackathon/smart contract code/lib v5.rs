#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, token, Address, Env, Vec};

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    TimeLock,
    DepositRecords,
    Authenticators,
    WithdrawalEnabled,
    Receiver,
}

#[derive(Clone)]
#[contracttype]
pub struct TimeLockConfig {
    pub deadline: u64,
    pub withdrawal_enabled: bool,
}

#[derive(Clone)]
#[contracttype]
pub struct Deposit {
    pub depositor: Address,
    pub amount: i128,
}

#[contract]
pub struct TrustFundContract;

fn random_choice(env: &Env, addresses: &Vec<Address>, count: usize) -> Vec<Address> {
    let mut selected: Vec<Address> = Vec::new(env);

    let mut remaining_addresses = addresses.clone();
    while selected.len() < count as u32 && remaining_addresses.len() > 0 {
        let index = env.random_u64() % remaining_addresses.len() as u64;
        selected.push(remaining_addresses.get(index as u32).unwrap().clone());
        remaining_addresses.remove(index as u32);
    }
    selected
    
}

#[contractimpl]
impl TrustFundContract {
    // Function to set the time lock and store the deposit rules
    pub fn set_time_lock(env: Env, deadline: u64, withdrawal_enabled: bool, receiver: Address) {
        env.storage().instance().set(
            &DataKey::TimeLock,
            &TimeLockConfig {
                deadline,
                withdrawal_enabled,
            },
        );
        env.storage().instance().set(&DataKey::Receiver, &receiver);
    }

    // Function to initialize the 15 addresses
    pub fn upload_addresses(env: Env, addresses: Vec<Address>) {
        if addresses.len() != 15 {
            panic!("Exactly 15 addresses must be uploaded");
        }

        env.storage().instance().set(&DataKey::Authenticators, &addresses);
    }

    // Function to trigger the random selection of 5 authenticators
    pub fn select_authenticators(env: Env) {
        let addresses: Vec<Address> = env.storage().instance().get(&DataKey::Authenticators).unwrap();

        if addresses.len() != 15 {
            panic!("Must have 15 addresses stored to select authenticators");
        }

        // Randomly select 5 authenticators from the uploaded 15 addresses
        let authenticators = random_choice(&env, &addresses, 5);

        // Store the 5 authenticators for later verification
        env.storage().instance().set(&DataKey::Authenticators, &authenticators);
    }

    // Function to read the authenticators
    pub fn get_authenticators(env: Env) -> Vec<Address> {
        env.storage().instance().get(&DataKey::Authenticators).unwrap()
    }

    // Function for an authenticator to enable withdrawals
    pub fn enable_withdrawals(env: Env, authenticator: Address) {
        let authenticators: Vec<Address> = env.storage().instance().get(&DataKey::Authenticators).unwrap();

        if !authenticators.contains(&authenticator) {
            panic!("Unauthorized: Only authenticators can enable withdrawals");
        }

        let mut time_lock: TimeLockConfig = env.storage().instance().get(&DataKey::TimeLock).unwrap();
        time_lock.withdrawal_enabled = true;

        env.storage().instance().set(&DataKey::TimeLock, &time_lock);
    }

    // Function to deposit tokens
    pub fn deposit(env: Env, depositor: Address, token: Address, amount: i128) {
        depositor.require_auth();
        let mut deposits: Vec<Deposit> = env.storage().instance().get(&DataKey::DepositRecords).unwrap_or(Vec::new(&env));

        token::Client::new(&env, &token).transfer(&depositor, &env.current_contract_address(), &amount);
        deposits.push_back(Deposit { depositor, amount });

        env.storage().instance().set(&DataKey::DepositRecords, &deposits);
    }

    // Function to allow the receiver to claim all tokens if the time lock has expired and withdrawals are enabled
    pub fn claim_all(env: Env, receiver: Address) {
        receiver.require_auth();

        let time_lock: TimeLockConfig = env.storage().instance().get(&DataKey::TimeLock).unwrap();
        let stored_receiver: Address = env.storage().instance().get(&DataKey::Receiver).unwrap();

        if env.ledger().timestamp() < time_lock.deadline {
            panic!("Deadline has not been reached yet");
        }

        if !time_lock.withdrawal_enabled {
            // Return all funds to depositors if withdrawals are not enabled by authenticators
            let deposits: Vec<Deposit> = env.storage().instance().get(&DataKey::DepositRecords).unwrap();
            for deposit in deposits.iter() {
                token::Client::new(&env, &deposit.depositor).transfer(
                    &env.current_contract_address(),
                    &deposit.depositor,
                    &deposit.amount,
                );
            }
        } else {
            // Ensure only the pre-set receiver can claim all funds
            if receiver != stored_receiver {
                panic!("Unauthorized: Only the pre-set receiver can claim the funds");
            }

            // Transfer all funds to the receiver
            let deposits: Vec<Deposit> = env.storage().instance().get(&DataKey::DepositRecords).unwrap();
            let mut total_amount: i128 = 0;
            for deposit in deposits.iter() {
                total_amount += deposit.amount;
            }

            token::Client::new(&env, &stored_receiver).transfer(
                &env.current_contract_address(),
                &stored_receiver,
                &total_amount,
            );
        }

        // Clear the deposit records once funds are claimed or returned
        env.storage().instance().remove(&DataKey::DepositRecords);
    }
}
