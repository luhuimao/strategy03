
USE strategy_db; 

CREATE TABLE IF NOT EXISTS `wallet`(
    `id` INT UNSIGNED AUTO_INCREMENT,
    `wallet_address` VARCHAR(100),
    `revised_time` DATETIME,
    `created_time` DATETIME,
    `strategy_id` INT,
    PRIMARY KEY ( `id` )
)ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `strategies`(
    `id` INT UNSIGNED AUTO_INCREMENT,
    `wallet_address` VARCHAR(100),
    `strategy_name` VARCHAR(100),
    `straregy_desc` VARCHAR(100),
    `strategy_originary` VARCHAR(100),
    `strategy_status` VARCHAR(100),
    `del` INT,
    `types` VARCHAR(100),
    `parameter` FLOAT,
    `save_path` VARCHAR(100),
    `file_name` VARCHAR(100),
    `revised_time` DATETIME,
    `created_time` DATETIME,
    PRIMARY KEY ( `id` )
)ENGINE=InnoDB DEFAULT CHARSET=utf8;


CREATE TABLE IF NOT EXISTS `trading_records`(
    `id` INT UNSIGNED AUTO_INCREMENT,
    `transaction_hash` VARCHAR(100),
    `strategy_id` INT,
    `symbol` VARCHAR(100),
    `num_of_eth` FLOAT,
    `transaction_fees` FLOAT,
    `order_open_time` DATETIME,
    `order_close_time` DATETIME,
    `order_open_price` DATETIME,
    `order_close_price` DATETIME,
    `num_of_profit` FLOAT,
    `status_of_transaction` VARCHAR(100),
    PRIMARY KEY ( `id` )
)ENGINE=InnoDB DEFAULT CHARSET=utf8;