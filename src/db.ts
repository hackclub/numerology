import "reflect-metadata"
import {
    CreateDateColumn,
    DataSource,
    Entity,
    Column,
    PrimaryGeneratedColumn,
} from "typeorm"

@Entity()
export class AI21Call {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    createdAt: Date

    @Column()
    cost: number
}

@Entity()
export class Thread {
    @PrimaryGeneratedColumn()
    id: number

    @CreateDateColumn()
    createdAt: Date

    @Column()
    ts: string
}

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    name: string

    @Column()
    qualities: string

    @Column()
    example: string

    @Column()
    emoji: string
}

export const db = new DataSource({
    type: "sqlite",
    database: "db.sqlite",
    entities: [AI21Call, Thread, User],
    synchronize: true,
})
