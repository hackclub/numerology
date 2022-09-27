import "reflect-metadata"
import { DataSource, Entity, Column, PrimaryGeneratedColumn } from "typeorm"

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
    entities: [User],
    synchronize: true,
})
